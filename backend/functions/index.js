const functions = require('firebase-functions');
const admin = require('firebase-admin');
const gcs = require('@google-cloud/storage')();
const path = require('path');
const os = require('os');
const fs = require('fs');
const PDFParser = require("pdf2json");

admin.initializeApp(functions.config().firebase);

exports.extractTextFromCvPdf = functions.storage.object().onChange((event) => {
    const object = event.data;
    const fileBucket = object.bucket;
    const filePath = object.name;
    const contentType = object.contentType;
    const resourceState = object.resourceState;
    const metageneration = object.metageneration;
    const fileName = path.basename(filePath);
    const dirPath = filePath.split(path.sep);
    const uid = dirPath[1];

    if(contentType.indexOf('application/pdf') === -1){
      console.log('This is not a pdf');
      return null;
    }

    if (resourceState === 'not_exists') {
      console.log('This is a deletion event.');
      return null;
    }

    const bucket = gcs.bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);

    let downloadFile = function() {
      return new Promise((resolve, reject) => {
        resolve( bucket.file(filePath).download({ destination: tempFilePath }));
      });
    };

    let extractTextFromPdf = function() {
      return new Promise((resolve, reject) => {
        let pdfParser = new PDFParser(this,1);
        pdfParser.loadPDF(tempFilePath);
        pdfParser.on("pdfParser_dataReady", pdfData => {
          let text = pdfParser.getRawTextContent();
          resolve(text);
        });
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
      });
    };

    let addTextToCvCollection = function(text) {
      return new Promise((resolve, reject) => {
        resolve(admin.firestore().collection('cv').doc(uid).set({
          cvText: text,
          uid: uid
        }));
      });
    };

    let removeFromTempFilePath = function() {
      return new Promise((resolve, reject) => {
        resolve(fs.unlinkSync(tempFilePath));
      });
    };

    return downloadFile().then(() => {
      console.log('PDF downloaded locally to', tempFilePath);
      return extractTextFromPdf();
    }).then((text) => {
      console.log("Text extracted from " + fileName);
      return addTextToCvCollection(text);
    }).then(() => {
      console.log("Text added to collection");
      return removeFromTempFilePath();
    }).then(() => {
      return console.log(fileName + " removed from /tmp");
    }).catch((reject) => {
      console.log(reject);
    });
});

exports.extraxtTextFromUploadedPdf = functions.firestore.document('cv/{userId}').onWrite((event) => {
  console.log(event.data.data());
});
