const fs = require('fs');
const readline = require('readline');
const CSV = require('./function');
const constants = require('./constants');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Please enter the SKU prefix, keyword and ID option [0, 1] separated by a comma(,): ', (input) => {
    const parts = input.split(',').map(item => item.trim());
    if (parts.length !== 3) {
        console.log('Invalid input. Please enter exactly two items separated by a comma.');
        rl.close();
        return;
    }
    const [prefix, keyword, removeID] = parts;
    fs.access(`./data/${constants.dataFileName}.csv`, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`File ${constants.dataFileName} does not exist`);
        } else {
            CSV.readFile({ fileName: constants.dataFileName, resetOriginalHeader: 1 })
                .then(data => {
                    const fixedData = CSV.fixContent({ data, prefix });
                    CSV.readFile({ fileName: constants.headerFileName, resetOriginalHeader: 0 })
                    .then(headers => {
                        const finalData = CSV.fixHeader({ data: fixedData, headers, keyword });
                        CSV.saveFile({ fileName: constants.outputFileName, data: finalData, removeID: removeID });
                    })
                    .catch(error => console.error(`Error: ${error}`));
                })
                .catch(error => console.error(`Error: ${error}`));
        }
    });
    rl.close();
});