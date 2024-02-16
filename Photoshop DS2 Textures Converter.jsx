// Photoshop DS2 Textures Converter.jsx
// 2022 - Pear
var normalTextureDoc;
var specularTextureDoc;
var textureFiles;

function selectChannelLayer(color) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated(charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), stringIDToTypeID(color));
    desc.putReference(charIDToTypeID('null'), ref);
    executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
}

function selectAllChannelLayers() {
    activeDocument.activeChannels = [activeDocument.channels[0], activeDocument.channels[1], activeDocument.channels[2]];
}

function saveCurrentDocAsPNG(rootPath) {
    var pngOpts = new PNGSaveOptions;
    pngOpts.compression = 0;
    pngOpts.interlaced = false;
    var pngFile = File(rootPath + '/' + activeDocument.name.replace('.dds', '.png'));
    activeDocument.flipCanvas(Direction.VERTICAL);
    activeDocument.saveAs(pngFile, pngOpts, true, Extension.LOWERCASE);
}

function mergeSpecularToNormal() {
    activeDocument = specularTextureDoc;
    activeDocument.activeLayer.isBackgroundLayer = false;
    if (activeDocument.channels.length < 4) {
        selectChannelLayer('green');
    } else {
        activeDocument.activeChannels = [activeDocument.channels[3]];
    }
    activeDocument.selection.selectAll();
    var scalar = (normalTextureDoc.width / activeDocument.width) * 100;
    activeDocument.selection.resize(scalar, scalar);
    activeDocument.selection.copy();
    activeDocument = normalTextureDoc;
    selectChannelLayer('blue');
    activeDocument.selection.selectAll();
    activeDocument.selection.clear();
    activeDocument.paste();
    selectChannelLayer('green');
    activeDocument.selection.selectAll();
    activeDocument.selection.copy();
    selectChannelLayer('red');
    activeDocument.selection.selectAll();
    activeDocument.selection.clear();
    activeDocument.paste();
    activeDocument.activeChannels = [activeDocument.channels[3]];
    activeDocument.selection.selectAll();
    activeDocument.selection.copy();
    activeDocument.channels[3].remove();
    selectChannelLayer('green');
    activeDocument.selection.selectAll();
    activeDocument.selection.clear();
    activeDocument.paste();
    activeDocument.selection.deselect();
    selectAllChannelLayers();
    saveCurrentDocAsPNG(activeDocument.path);
}

function checkFileNameType(index, type, ext) {
    return textureFiles[index].name.toLowerCase().indexOf(type) != -1 && textureFiles[index].name.toLowerCase().indexOf(ext) != -1;
}

function closeAllOpenFiles() {
    if (documents.length) {
        while (documents.length > 0) {
            activeDocument.close(SaveOptions.DONOTSAVECHANGES);
        }
    }
}

function main() {
    closeAllOpenFiles();
    var texturesFolder = Folder.selectDialog('Select a folder containing the desired textures', '');
    textureFiles = texturesFolder.getFiles();
    displayDialogs = DialogModes.NO;
    for (var i = 0; i < textureFiles.length; i++) {
        if (checkFileNameType(i, '_d', '.png')) {
            albedoTextureDoc = open(textureFiles[i]);
            activeDocument = albedoTextureDoc;
            saveCurrentDocAsPNG(activeDocument.path);
        } else if (checkFileNameType(i, '_n', '.dds')) {
            normalTextureDoc = open(textureFiles[i]);
            if (specularTextureDoc) {
                mergeSpecularToNormal();
            }
        } else if (checkFileNameType(i, '_s', '.dds')) {
            specularTextureDoc = open(textureFiles[i]);
            if (normalTextureDoc) {
                mergeSpecularToNormal();
                documents.add(specularTextureDoc.width, specularTextureDoc.height, specularTextureDoc.resolution,
                    specularTextureDoc.name.replace('_s', '_m').replace('.dds', '.png'), NewDocumentMode.RGB);
                var metallicTextureDoc = activeDocument;
                activeDocument = specularTextureDoc;
                selectChannelLayer('red');
                activeDocument.selection.selectAll();
                activeDocument.selection.copy();
                activeDocument = metallicTextureDoc;
                activeDocument.activeLayer.isBackgroundLayer = false;
                activeDocument.paste();
                activeDocument.layers[activeDocument.layers.length - 1].remove();
                saveCurrentDocAsPNG(specularTextureDoc.path);
                closeAllOpenFiles();
                normalTextureDoc = null;
                specularTextureDoc = null;
            }
        }
    }
}
main();