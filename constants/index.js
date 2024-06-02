const constants = {
    dataFileName: 'data',
    headerFileName: 'headers',
    outputFileName: `output-${new Date().toLocaleDateString('en-GB').split('/').join('-')}`
}

module.exports = constants;