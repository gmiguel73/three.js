import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_ROOT = 'assets';

class AssetLibraryClass {

    constructor() {

        this._loader = new GLTFLoader();
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

        // scaffold no-op

    }

    getManifest( moduleType ) {

        const url = `${this._baseUrl}${ASSET_ROOT}/${moduleType}/manifest.json`;
        return this._fetch( url );

    }

    loadVariant( moduleType, part, variant ) {

        const url = `${this._baseUrl}${ASSET_ROOT}/${moduleType}/${part}/${variant}.glb`;

        return new Promise( ( resolve, reject ) => {

            this._loader.load(
                url,
                ( gltf ) => resolve( gltf.scene ),
                undefined,
                reject
            );

        } );

    }

    async loadModuleParts( moduleType, partsParams = {} ) {

        const manifest = await this.getManifest( moduleType );
        const parts = manifest.parts || {};
        const entries = await Promise.all( Object.entries( parts ).map( async ( [ partName, partDef ] ) => {

            const variantName = ( partsParams && partsParams[ partName ] ) || partDef.default;
            const scene = await this.loadVariant( moduleType, partName, variantName );
            return [ partName, { scene, variantName } ];

        } ) );
        return Object.fromEntries( entries );

    }

}

export const AssetLibrary = new AssetLibraryClass();
