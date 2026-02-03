const Re = require('react-resizable-panels');
console.log('Exports:', Object.keys(Re));
try {
    const PanelGroup = require('react-resizable-panels').PanelGroup;
    console.log('PanelGroup:', PanelGroup);
} catch (e) {
    console.error(e);
}
