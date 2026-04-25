import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const ASSET_ROOT = 'assets';

/**
 * Singleton loader/cache for module glTF assets.
 *
 * Lifecycle:
 *   - getManifest(moduleType)         -> reads Spaceship/assets/<type>/manifest.json once.
 *   - loadVariant(type, part, name)   -> loads .glb once; returns a fresh clone per call.
 *   - loadModuleParts(type, picks)    -> resolves chosen variants (falling back to manifest
 *                                        defaults), loads them in parallel, returns
 *                                        { partName: { scene, variantDef, variantName } }.
 *
 * Tests can swap out the underlying loader and fetcher via setLoader() / setFetcher()
 * to avoid touching the network or the filesystem.
 */
class AssetLibraryClass {

    constructor() {

        this._loader = new GLTFLoader();
        this._manifestCache = new Map();
        this._sceneCache = new Map();
        this._baseUrl = new URL( '../../', import.meta.url ).href;
        this._fetch = ( url ) => fetch( url ).then( ( r ) => {

            if ( ! r.ok ) throw new Error( `HTTP ${r.status} for ${url}` );
            return r.json();

        } );

    }

    setLoader( loader ) {

        this._loader = loader;

    }

    setFetcher( fn ) {

        this._fetch = fn;

    }

    setBaseUrl( url ) {

        this._baseUrl = url.endsWith( '/' ) ? url : url + '/';

    }

    reset() {

        this._manifestCache.clear();
        this._sceneCache.clear();

    }

    getManifest( moduleType ) {

        if ( this._manifestCache.has( moduleType ) ) {

            return this._manifestCache.get( moduleType );

        }

        const url = `${this._baseUrl}${ASSET_ROOT}/${moduleType}/manifest.json`;
        const p = Promise.resolve().then( () => this._fetch( url ) ).catch( ( err ) => {

            // Drop the cache entry so callers can retry after fixing the file/network.
            this._manifestCache.delete( moduleType );
            throw err;

        } );

        this._manifestCache.set( moduleType, p );
        return p;

    }

    loadVariant( moduleType, part, variant ) {

        const url = `${this._baseUrl}${ASSET_ROOT}/${moduleType}/${part}/${variant}.glb`;

        if ( ! this._sceneCache.has( url ) ) {

            const p = new Promise( ( resolve, reject ) => {

                this._loader.load(
                    url,
                    ( gltf ) => resolve( gltf.scene ),
                    undefined,
                    ( err ) => {

                        this._sceneCache.delete( url );
                        reject( err );

                    }
                );

            } );

            this._sceneCache.set( url, p );

        }

        return this._sceneCache.get( url ).then( ( scene ) => cloneSkeleton( scene ) );

    }

    async loadModuleParts( moduleType, partsParams = {} ) {

        const manifest = await this.getManifest( moduleType );
        const parts = manifest.parts || {};

        const tasks = Object.entries( parts ).map( async ( [ partName, partDef ] ) => {

            const variantName = ( partsParams && partsParams[ partName ] ) || partDef.default;

            if ( ! variantName ) {

                throw new Error( `No variant chosen for part "${partName}" in module "${moduleType}"` );

            }

            const variantDef = partDef.variants && partDef.variants[ variantName ];

            if ( ! variantDef ) {

                throw new Error( `Unknown variant "${variantName}" for part "${partName}" in module "${moduleType}"` );

            }

            const scene = await this.loadVariant( moduleType, partName, variantName );

            if ( Array.isArray( variantDef.attach ) ) {

                scene.position.fromArray( variantDef.attach );

            }

            return [ partName, { scene, variantDef, variantName } ];

        } );

        const settled = await Promise.all( tasks );
        return Object.fromEntries( settled );

    }

}

export const AssetLibrary = new AssetLibraryClass();
