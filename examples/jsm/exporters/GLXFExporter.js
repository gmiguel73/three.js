import {
	Scene,
	REVISION
} from 'three';
import { GLTFExporter } from '../exporters/GLTFExporter.js';

/**
 * An exporter for the glTF Experience Format (glXF).
 *
 * glXF is a scene composition format that references external glTF assets by URI.
 * It contains no geometry, materials, textures, or animations -- only a node hierarchy
 * with references to external `.gltf` files.
 *
 * ```js
 * const exporter = new GLXFExporter();
 * const result = await exporter.parseAsync( scene );
 * // result.glxf   - the .glxf JSON string
 * // result.assets - Map of generated .gltf filenames to their JSON strings
 * ```
 *
 * Objects can be tagged with `userData.glxfURI` to reference external assets
 * instead of auto-exporting them. When a parent node has `userData.glxfURI`,
 * its entire subtree is claimed as a single asset and any `userData.glxfURI`
 * on descendants is ignored with a warning.
 *
 * @see https://github.com/KhronosGroup/glTF-External-Reference/blob/main/specification/2.0/README.md
 * @three_import import { GLXFExporter } from 'three/addons/exporters/GLXFExporter.js';
 */
class GLXFExporter {

	/**
	 * Constructs a new glXF exporter.
	 */
	constructor() {

		/**
		 * Options passed to GLTFExporter when auto-exporting assets.
		 *
		 * @type {?Object}
		 * @default null
		 */
		this.gltfExportOptions = null;

	}

	/**
	 * Parses the given scene and generates glXF output.
	 *
	 * @param {Scene} input - The scene to export.
	 * @param {Function} onDone - Callback receiving the result `{ glxf, assets }`.
	 * @param {Function} onError - Callback receiving any error.
	 * @param {Object} [options={}] - Export options.
	 * @param {boolean} [options.experience=true] - Whether to set the `experience` flag.
	 * @param {Object} [options.gltfExportOptions={}] - Options forwarded to GLTFExporter.
	 */
	parse( input, onDone, onError, options = {} ) {

		this._parseAsync( input, options ).then( onDone ).catch( onError );

	}

	/**
	 * Async version of {@link GLXFExporter#parse}.
	 *
	 * @param {Scene} input - The scene to export.
	 * @param {Object} [options={}] - Export options.
	 * @return {Promise<{glxf: string, assets: Map<string, string>}>} The glXF JSON and generated assets.
	 */
	parseAsync( input, options = {} ) {

		return this._parseAsync( input, options );

	}

	async _parseAsync( input, options ) {

		const experience = options.experience !== undefined ? options.experience : true;
		const gltfExportOptions = options.gltfExportOptions || this.gltfExportOptions || {};

		const scenes = Array.isArray( input ) ? input : [ input ];

		const context = {
			assetEntries: [],
			assetURIToIndex: new Map(),
			nodes: [],
			scenesDef: [],
			generatedAssets: new Map(),
			autoAssetCounter: 0,
			gltfExporter: new GLTFExporter(),
			gltfExportOptions: gltfExportOptions,
		};

		for ( let i = 0; i < scenes.length; i ++ ) {

			await this._processScene( scenes[ i ], context );

		}

		const glxf = {
			asset: {
				version: '2.0',
				generator: 'Three.js GLXFExporter r' + REVISION,
			},
		};

		if ( experience ) {

			glxf.asset.experience = true;

		}

		if ( context.assetEntries.length > 0 ) {

			glxf.assets = context.assetEntries;

		}

		if ( context.nodes.length > 0 ) {

			glxf.nodes = context.nodes;

		}

		if ( context.scenesDef.length > 0 ) {

			glxf.scenes = context.scenesDef;
			glxf.scene = 0;

		}

		return {
			glxf: JSON.stringify( glxf, null, '\t' ),
			assets: context.generatedAssets,
		};

	}

	async _processScene( scene, context ) {

		const rootChildren = [];

		for ( let i = 0; i < scene.children.length; i ++ ) {

			const childIndex = await this._processNode( scene.children[ i ], context, null, null );

			if ( childIndex !== - 1 ) {

				rootChildren.push( childIndex );

			}

		}

		if ( rootChildren.length > 0 ) {

			const sceneDef = {};

			if ( scene.name ) {

				sceneDef.name = scene.name;

			}

			sceneDef.nodes = rootChildren;
			context.scenesDef.push( sceneDef );

		}

	}

	async _processNode( object, context, claimedURI, claimedAncestorName ) {

		const nodeIndex = context.nodes.length;
		const nodeDef = {};

		if ( object.name ) {

			nodeDef.name = object.name;

		}

		// TRS -- only emit when non-identity
		const pos = object.position;
		const quat = object.quaternion;
		const scl = object.scale;

		if ( pos.x !== 0 || pos.y !== 0 || pos.z !== 0 ) {

			nodeDef.translation = [ pos.x, pos.y, pos.z ];

		}

		if ( quat.x !== 0 || quat.y !== 0 || quat.z !== 0 || quat.w !== 1 ) {

			nodeDef.rotation = [ quat.x, quat.y, quat.z, quat.w ];

		}

		if ( scl.x !== 1 || scl.y !== 1 || scl.z !== 1 ) {

			nodeDef.scale = [ scl.x, scl.y, scl.z ];

		}

		// Determine if this node defines or inherits a glxfURI
		let effectiveURI = claimedURI;
		let effectiveAncestor = claimedAncestorName;
		const ownURI = object.userData ? object.userData.glxfURI : undefined;

		if ( ownURI !== undefined ) {

			if ( claimedURI !== null ) {

				console.warn(
					'GLXFExporter: Ignoring userData.glxfURI on "' + ( object.name || '(unnamed)' ) +
					'" because ancestor "' + ( claimedAncestorName || '(unnamed)' ) + '" already defines one.'
				);

			} else {

				effectiveURI = ownURI;
				effectiveAncestor = object.name || '(unnamed)';

			}

		}

		const hasGeometry = object.isMesh || object.isSkinnedMesh || object.isPoints || object.isLine;
		const isSubtreeRoot = ( ownURI !== undefined && claimedURI === null );

		if ( isSubtreeRoot ) {

			// This node claims the subtree. Register it as an asset node.
			const assetIndex = await this._getOrCreateAsset( object, effectiveURI, context );
			nodeDef.asset = assetIndex;

			// Walk children to emit warnings for any that also have glxfURI
			this._warnNestedURIs( object, effectiveAncestor );

			context.nodes.push( nodeDef );
			return nodeIndex;

		}

		if ( hasGeometry ) {

			const assetIndex = await this._getOrCreateAsset( object, effectiveURI, context );
			nodeDef.asset = assetIndex;
			context.nodes.push( nodeDef );
			return nodeIndex;

		}

		// Non-geometry node without its own URI: process children
		const childIndices = [];

		for ( let i = 0; i < object.children.length; i ++ ) {

			const childIndex = await this._processNode( object.children[ i ], context, effectiveURI, effectiveAncestor );

			if ( childIndex !== - 1 ) {

				childIndices.push( childIndex );

			}

		}

		if ( childIndices.length > 0 ) {

			nodeDef.children = childIndices;
			context.nodes.push( nodeDef );
			return nodeIndex;

		}

		context.nodes.push( nodeDef );
		return nodeIndex;

	}

	_warnNestedURIs( object, ancestorName ) {

		for ( let i = 0; i < object.children.length; i ++ ) {

			const child = object.children[ i ];

			if ( child.userData && child.userData.glxfURI !== undefined ) {

				console.warn(
					'GLXFExporter: Ignoring userData.glxfURI on "' + ( child.name || '(unnamed)' ) +
					'" because ancestor "' + ( ancestorName || '(unnamed)' ) + '" already defines one.'
				);

			}

			this._warnNestedURIs( child, ancestorName );

		}

	}

	async _getOrCreateAsset( object, manualURI, context ) {

		if ( manualURI !== undefined && manualURI !== null ) {

			// External/manual reference
			if ( context.assetURIToIndex.has( manualURI ) ) {

				return context.assetURIToIndex.get( manualURI );

			}

			const assetDef = { uri: manualURI };
			const ud = object.userData || {};

			if ( ud.glxfScene !== undefined ) assetDef.scene = ud.glxfScene;
			if ( ud.glxfNodes !== undefined ) assetDef.nodes = ud.glxfNodes;
			if ( ud.glxfTransform !== undefined ) assetDef.transform = ud.glxfTransform;

			const index = context.assetEntries.length;
			context.assetEntries.push( assetDef );
			context.assetURIToIndex.set( manualURI, index );
			return index;

		}

		// Auto-export: generate a .gltf file for this object
		const filename = 'asset_' + ( context.autoAssetCounter ++ ) + '.gltf';

		const gltfData = await context.gltfExporter.parseAsync( object, context.gltfExportOptions );
		context.generatedAssets.set( filename, typeof gltfData === 'string' ? gltfData : JSON.stringify( gltfData ) );

		const index = context.assetEntries.length;
		context.assetEntries.push( { uri: filename } );
		context.assetURIToIndex.set( filename, index );
		return index;

	}

}

export { GLXFExporter };
