(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
    typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.SixDOF = {}, global.THREE));
})(this, (function (exports, three) { 'use strict';

    var frag = "#define GLSLIFY 1\nvec3 getDepth(sampler2D depth,vec2 uvs){return texture2D(depth,uvs).rgb;}vec3 getDepthFromBottomHalf(sampler2D tex,vec2 uvs){vec2 lower_half_uvs=vec2(uvs.x,uvs.y*0.5);return texture2D(tex,lower_half_uvs).rgb;}vec3 getColorFromUpperHalf(sampler2D tex,vec2 uvs){vec2 upper_half_uvs=vec2(uvs.x,(uvs.y*0.5)+0.5);return texture2D(tex,upper_half_uvs).rgb;}uniform sampler2D colorTexture;uniform sampler2D depthTexture;uniform float debugDepth;uniform float opacity;varying vec2 vUv;vec3 depth;vec3 color;void main(){\n#ifdef TOP_BOTTOM\ndepth=getDepthFromBottomHalf(colorTexture,vUv);color=getColorFromUpperHalf(colorTexture,vUv);\n#endif\n#ifdef SEPERATE\ndepth=getDepth(depthTexture,vUv);color=texture2D(colorTexture,vUv).rgb;\n#endif\nvec3 depthColorMixer=mix(color,depth,debugDepth);gl_FragColor=vec4(depthColorMixer,opacity);}"; // eslint-disable-line

    var vert = "#define GLSLIFY 1\nvec3 getDepth(sampler2D depth,vec2 uvs){return texture2D(depth,uvs).rgb;}vec3 getDepthFromBottomHalf(sampler2D tex,vec2 uvs){vec2 lower_half_uvs=vec2(uvs.x,uvs.y*0.5);return texture2D(tex,lower_half_uvs).rgb;}uniform sampler2D colorTexture;uniform sampler2D depthTexture;uniform float pointSize;uniform float displacement;varying vec2 vUv;float depth;void main(){vUv=uv;gl_PointSize=pointSize;\n#ifdef TOP_BOTTOM\ndepth=getDepthFromBottomHalf(colorTexture,vUv).r;\n#endif\n#ifdef SEPERATE\ndepth=getDepth(depthTexture,vUv).r;\n#endif\nfloat disp=displacement*depth;vec3 offset=position+(-normal)*disp;gl_Position=projectionMatrix*modelViewMatrix*vec4(offset,1.0);}"; // eslint-disable-line

    var Uniforms = {
      colorTexture: {
        type: 't',
        value: null
      },
      depthTexture: {
        type: 't',
        value: null
      },
      time: {
        type: 'f',
        value: 0.0
      },
      opacity: {
        type: 'f',
        value: 1.0
      },
      pointSize: {
        type: 'f',
        value: 3.0
      },
      debugDepth: {
        type: 'f',
        value: 0.0
      },
      displacement: {
        type: 'f',
        value: 1.0
      }
    };

    var MeshDensity = /*#__PURE__*/function (MeshDensity) {
      MeshDensity[MeshDensity["LOW"] = 64] = "LOW";
      MeshDensity[MeshDensity["MEDIUM"] = 128] = "MEDIUM";
      MeshDensity[MeshDensity["HIGH"] = 256] = "HIGH";
      MeshDensity[MeshDensity["EXTRA_HIGH"] = 512] = "EXTRA_HIGH";
      MeshDensity[MeshDensity["EPIC"] = 1024] = "EPIC";
      return MeshDensity;
    }(MeshDensity || {});
    var Style = /*#__PURE__*/function (Style) {
      Style[Style["WIRE"] = 0] = "WIRE";
      Style[Style["POINTS"] = 1] = "POINTS";
      Style[Style["MESH"] = 2] = "MESH";
      return Style;
    }(Style || {});
    var TextureType = /*#__PURE__*/function (TextureType) {
      TextureType[TextureType["TOP_BOTTOM"] = 0] = "TOP_BOTTOM";
      TextureType[TextureType["SEPERATE"] = 1] = "SEPERATE";
      return TextureType;
    }(TextureType || {});
    class Props {
      constructor() {
        this.type = TextureType.SEPERATE;
        this.density = MeshDensity.HIGH;
        this.style = Style.MESH;
        this.displacement = 4.0;
        this.radius = 6;
      }
    }

    class Viewer extends three.Object3D {
      constructor(texture, depth, props) {
        super();

        /** Assign the user provided props, if any */
        /** Default props if not provided */
        this.props = new Props();
        this.material = new three.ShaderMaterial({
          uniforms: Uniforms,
          vertexShader: vert,
          fragmentShader: frag,
          transparent: true,
          side: three.BackSide
        });
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
        defines.forEach(function (define) {
          return material.defines[define] = '';
        });
      }

      /** Internal util to create buffer geometry */
      createSphereGeometry(radius, meshDensity) {
        return new three.SphereBufferGeometry(radius, meshDensity, meshDensity);
      }

      /** Internal util to set viewer props from config object */
      setProps(viewerProps, userProps) {
        if (!userProps) return;

        /** Iterate over user provided props and assign to viewer props */
        for (var prop in userProps) {
          if (viewerProps[prop]) {
            viewerProps[prop] = userProps[prop];
          } else {
            console.warn("THREE.SixDOF: Provided ".concat(prop, " in config but it is not a valid property and being ignored"));
          }
        }
      }

      /** Internal util to assign the textures to the shader uniforms */
      assignTexture(type, colorTexture, depthTexture) {
        /** Check wheter we are rendering top bottom or just single textures */
        if (type === TextureType.SEPERATE) {
          if (!depthTexture) throw new Error('When using seperate texture type, depthmap must be provided');
          this.depth = this.setDefaultTextureProps(depthTexture);
        }

        /** Assign the main texture */
        this.texture = this.setDefaultTextureProps(colorTexture);
      }
      setDefaultTextureProps(texture) {
        texture.minFilter = three.NearestFilter;
        texture.magFilter = three.LinearFilter;
        texture.format = three.RGBAFormat;
        texture.colorSpace = three.SRGBColorSpace;
        texture.generateMipmaps = false;
        return texture;
      }

      /** An internal util to create the Mesh Object3D */
      createMesh(geo, mat, style) {
        switch (style) {
          case Style.WIRE:
            if (!this.material.wireframe) this.material.wireframe = true;
            return new three.Mesh(geo, mat);
          case Style.MESH:
            if (this.material.wireframe) this.material.wireframe = false;
            return new three.Mesh(geo, mat);
          case Style.POINTS:
            return new three.Points(geo, mat);
        }
      }

      /** Toggle vieweing texture or depthmap in viewer */
      toggleDepthDebug(state) {
        this.material.uniforms.debugDepth.value = state != undefined ? state : !this.material.uniforms.debugDepth.value;
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
    Viewer.geometry = void 0;

    exports.MeshDensity = MeshDensity;
    exports.Style = Style;
    exports.TextureType = TextureType;
    exports.Viewer = Viewer;

}));
//# sourceMappingURL=three-6dof.js.map
