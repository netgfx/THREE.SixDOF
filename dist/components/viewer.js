import { Object3D, ShaderMaterial, BackSide, Mesh, Points, SphereBufferGeometry, NearestFilter, LinearFilter, RGBAFormat, SRGBColorSpace, } from './three';
// @ts-ignore
import frag from '../shaders/sixdof.frag';
// @ts-ignore
import vert from '../shaders/sixdof.vert';
import { Uniforms } from './uniforms';
import { Style, TextureType, Props } from './constants';
export default class Viewer extends Object3D {
    constructor(texture, depth, props) {
        super();
        /** Default props if not provided */
        this.props = new Props();
        this.material = new ShaderMaterial({
            uniforms: Uniforms,
            vertexShader: vert,
            fragmentShader: frag,
            transparent: true,
            side: BackSide,
        });
        /** Assign the user provided props, if any */
        this.setProps(this.props, props);
        // /** Add the compiler definitions needed to pick the right GLSL methods */
        this.setShaderDefines(this.material, [TextureType[this.props.type]]);
        /**
         * Create the geometry only once, it can be shared between instances
         *  of the viewer since it's kept as a static class member
         **/
        if (!Viewer.geometry) {
            Viewer.geometry = this.createSphereGeometry(this.props.radius, this.props.density);
        }
        /** Assign the textures and update the shader uniforms */
        this.assignTexture(this.props.type, texture, depth);
        /** Set the displacement using the public setter */
        this.displacement = this.props.displacement;
        /** Create the Mesh/Points and add it to the viewer object */
        super.add(this.createMesh(Viewer.geometry, this.material, this.props.style));
    }
    /** Small util to set the defines of the GLSL program based on textureType */
    setShaderDefines(material, defines) {
        defines.forEach(define => (material.defines[define] = ''));
    }
    /** Internal util to create buffer geometry */
    createSphereGeometry(radius, meshDensity) {
        return new SphereBufferGeometry(radius, meshDensity, meshDensity);
    }
    /** Internal util to set viewer props from config object */
    setProps(viewerProps, userProps) {
        if (!userProps)
            return;
        /** Iterate over user provided props and assign to viewer props */
        for (let prop in userProps) {
            if (viewerProps[prop]) {
                viewerProps[prop] = userProps[prop];
            }
            else {
                console.warn(`THREE.SixDOF: Provided ${prop} in config but it is not a valid property and being ignored`);
            }
        }
    }
    /** Internal util to assign the textures to the shader uniforms */
    assignTexture(type, colorTexture, depthTexture) {
        /** Check wheter we are rendering top bottom or just single textures */
        if (type === TextureType.SEPERATE) {
            if (!depthTexture)
                throw new Error('When using seperate texture type, depthmap must be provided');
            this.depth = this.setDefaultTextureProps(depthTexture);
        }
        /** Assign the main texture */
        this.texture = this.setDefaultTextureProps(colorTexture);
    }
    setDefaultTextureProps(texture) {
        texture.minFilter = NearestFilter;
        texture.magFilter = LinearFilter;
        texture.format = RGBAFormat;
        texture.colorSpace = SRGBColorSpace;
        texture.generateMipmaps = false;
        return texture;
    }
    /** An internal util to create the Mesh Object3D */
    createMesh(geo, mat, style) {
        switch (style) {
            case Style.WIRE:
                if (!this.material.wireframe)
                    this.material.wireframe = true;
                return new Mesh(geo, mat);
            case Style.MESH:
                if (this.material.wireframe)
                    this.material.wireframe = false;
                return new Mesh(geo, mat);
            case Style.POINTS:
                return new Points(geo, mat);
        }
    }
    /** Toggle vieweing texture or depthmap in viewer */
    toggleDepthDebug(state) {
        this.material.uniforms.debugDepth.value =
            state != undefined ? state : !this.material.uniforms.debugDepth.value;
    }
    /** Setter for displacement amount */
    set displacement(val) {
        this.material.uniforms.displacement.value = val;
    }
    /** Setter for depthmap uniform */
    set depth(map) {
        this.material.uniforms.depthTexture.value = map;
    }
    /** Setter for depthmap uniform */
    set texture(map) {
        this.material.uniforms.colorTexture.value = map;
    }
    /** Setter for the opacity */
    set opacity(val) {
        this.material.uniforms.opacity.value = val;
    }
    /** Setter for the point size */
    set pointSize(val) {
        this.material.uniforms.pointSize.value = val;
    }
    /** Getter for the current viewer props */
    get config() {
        return this.props;
    }
    /** Getter for the opacity */
    get opacity() {
        return this.material.uniforms.opacity.value;
    }
    /** Getter for the point size */
    get pointSize() {
        return this.material.uniforms.pointSize.value;
    }
    /** Getter for displacement amount */
    get displacement() {
        return this.material.uniforms.displacement.value;
    }
    /** Getter for texture */
    get texture() {
        return this.material.uniforms.colorTexture.value;
    }
    /** Getter for the depth texture */
    get depth() {
        return this.material.uniforms.opacity.value;
    }
}
//# sourceMappingURL=viewer.js.map