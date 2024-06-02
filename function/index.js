const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class CSV {

    static originalHeader = {};

    static readFile = ({ fileName, resetOriginalHeader }) => {
        console.log(`Reading ${fileName}...`);
        const results = [];
        if (resetOriginalHeader) CSV.originalHeader = {};
        const sanitizeHeader = (header) => {
            const newHeader = header.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
            CSV.originalHeader[newHeader] = header;
            return newHeader;
        }
        return new Promise((resolve, reject) => {
            fs.createReadStream(`./data/${fileName}.csv`)
                .pipe(csv({ mapHeaders: ({ header }) => sanitizeHeader(header) }))
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(error);
                });
        });
    }

    static fixContent = ({ data, prefix }) => {
        console.log('Fixing content...');
        const products = [];
        const variations = [];
        data.forEach((item, index) => {
            if (item?.type === 'variable') products.push({ idx: index, variations: [] });
            else variations.push(index);
        });
        variations.forEach((variation) => {
            const filtered = products.filter((product) => data[product.idx]?._id === data[variation]?.parent?.split(':')[1]);
            if (filtered.length > 0) {
                filtered[0].variations.push(variation);
            }
        });
        const date = new Date();
        products.forEach((product, productIdx) => {
            const dateString = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
            const sku = `${prefix}-${dateString}-${productIdx + 1}`;
            data[product.idx].sku = sku;
            product.variations.forEach((variation, variationIdx) => {
                data[variation].sku = `${sku}-${variationIdx + 1}`;
                data[variation].parent = `${sku}`;
            })
        });
        return data;
    }

    static fixHeader = ({ data, headers, keyword }) => {
        console.log('Fixing headers...');
        data.forEach((row) => {
            if(row.type === 'variable') {
                for (let field in headers[1]) {
                    if (headers[0][field] === '0') {
                        row[field] = headers[1][field];
                    } else {
                        row[field] = keyword;
                    }
                }
            }
        })
        return data;
    }

    static saveFile = ({ fileName, data, removeID }) => {
        console.log('Saving file...');
        // Remove ID column
        if (Number(removeID)) data.forEach(row => row._id = '');

        // Replace the sanitized headers in the data with the original headers
        const newData = data.map(row => {
            const newRow = {};
            for (const key in row) {
                newRow[CSV.originalHeader[key] || key] = row[key];
            }
            return newRow;
        });
    
        // Create the headers for the CSV file
        const headers = Object.values(CSV.originalHeader).map(header => ({id: header, title: header}));
    
        // Create a CSV writer
        const csvWriter = createCsvWriter({
            path: `./data/${fileName}-fixed.csv`,
            header: headers
        });
    
        // Write the data to the CSV file
        return csvWriter.writeRecords(newData);
    }
}

module.exports = CSV;