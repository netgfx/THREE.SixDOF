var MeshDensity;
(function (MeshDensity) {
    MeshDensity[MeshDensity["LOW"] = 64] = "LOW";
    MeshDensity[MeshDensity["MEDIUM"] = 128] = "MEDIUM";
    MeshDensity[MeshDensity["HIGH"] = 256] = "HIGH";
    MeshDensity[MeshDensity["EXTRA_HIGH"] = 512] = "EXTRA_HIGH";
    MeshDensity[MeshDensity["EPIC"] = 1024] = "EPIC";
})(MeshDensity || (MeshDensity = {}));
var Style;
(function (Style) {
    Style[Style["WIRE"] = 0] = "WIRE";
    Style[Style["POINTS"] = 1] = "POINTS";
    Style[Style["MESH"] = 2] = "MESH";
})(Style || (Style = {}));
var TextureType;
(function (TextureType) {
    TextureType[TextureType["TOP_BOTTOM"] = 0] = "TOP_BOTTOM";
    TextureType[TextureType["SEPERATE"] = 1] = "SEPERATE";
})(TextureType || (TextureType = {}));
class Props {
    constructor() {
        this.type = TextureType.SEPERATE;
        this.density = MeshDensity.HIGH;
        this.style = Style.MESH;
        this.displacement = 4.0;
        this.radius = 6;
    }
}
export { MeshDensity, Style, TextureType, Props };
//# sourceMappingURL=constants.js.map