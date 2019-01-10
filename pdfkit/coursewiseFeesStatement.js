var fs = require('fs');
var appLogger = require('../../logging/appLogger');
var PDFDocument = require('pdfkit');
var moment = require('moment');
var feesUtil = require('../../utilities/feesUtil');

var coord = {
    marginLeft: 15,
    marginTop: 0,
    colWidth: 15,
    rowHeight: 15,
    headerHeight: 20,
    textPadding: 0,
    defaultFontSize: 12,
    headerFontSize: 8,
    contentFontSize: 8,
    titleFontSize: 14,
    lineWidth: 1,
    labelFont: 'Times-Bold',
    dataFont: 'Times-Roman',
    rowPadding: 5
};

var defaultOptions = {
    size: 'A3',
    layout: 'landscape',
    recordsPerPage: 65,
    margins: {
        bottom: 0
    },
    numColumns: 16,
    reportTitle: 'Coursewise Fees Statement - Dec 2018'
};
var pageNo;

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function exportAllRecordsInOneFile(fieldSpec, rowVector, outputFileName, doc, options, callback) {
    if ((!callback) && (options instanceof Function)) {
        callback = options;
        options = null;
    }

    if (!options) {
        options = defaultOptions;
    }
    if (!doc) {
        doc = new PDFDocument(options);
        doc.pipe(fs.createWriteStream(outputFileName));
    } else {
        doc.addPage();
    }

    var context = {
        pageNo: 1
    };
    writeHeader(fieldSpec, rowVector, doc, options, context);

    //write column labels
    writeTableHeader(fieldSpec, rowVector, doc, options, context);

    //write column contents, if required with page breaks
    writeContents(fieldSpec, rowVector, doc, options, context);

    callback(null, doc);
}

function writeHeader(fieldSpec, rowVector, doc, options, context) {
    doc.fontSize(coord.defaultFontSize);
    doc.fontSize(14)
        .text("Batch: " + options.batchYear, 15, 20);

    doc.fontSize(14)
        .text(options.reportTitle, center(doc, options.reportTitle), 20);

    //rightAlign(doc, "Class: " + options.classSectionCode + " - " + options.programmeType, 15)
    doc.fontSize(14)
        .text("Class: " + options.classSectionCode + " - " + options.programmeName + " - " + options.programmeType, 15, 40);

}

function writeTableHeader(fieldSpec, rowVector, doc, options, context) {

    doc.fontSize(coord.headerFontSize);

    var posXofCells = [];

    var x = 20;
    doc.text("S No", 20, 220);
    posXofCells.push(20);
    doc.moveTo(x - 5, 60).lineTo(x - 5, doc.page.height - 30);

    x = 50;
    doc.text("Roll Number", x, 220);
    posXofCells.push(x);
    doc.moveTo(x - 5, 60).lineTo(x - 5, doc.page.height - 30);

    doc.save();
    doc.rotate(-90);

    context.numVariableColumns = 0;
    for (var i = 0; i < fieldSpec.columnLabels.length; i++) {
        if (fieldSpec.columnLabels[i] == "") {
            //this is a break, so continue without printing
            continue;
        }
        x = 80 + ((context.numVariableColumns + 1) * 15);

        doc.text(fieldSpec.columnLabels[i], -235, 80 + (context.numVariableColumns + 1) * 15);

        context.numVariableColumns++;
    }

    doc.rotate(90);
    //draw lines
    context.numVariableColumns = 0;
    for (var i = 0; i < fieldSpec.columnLabels.length; i++) {
        x = 80 + ((context.numVariableColumns + 1) * 15);
        if (fieldSpec.columnLabels[i] == "") {
            //this is a break, so continue after drawing a thick line
            doc.lineWidth(3);
            doc.moveTo(x - 2, 60).lineTo(x - 2, doc.page.height - 30).undash().stroke();
            doc.lineWidth(0.5);
            continue;
        }
        //store position of the current column
        posXofCells.push(x);
        doc.lineWidth(1);
        doc.moveTo(x - 2, 60).lineTo(x - 2, doc.page.height - 30).undash().stroke();
        context.numVariableColumns++;
    }

    x = 80 + ((context.numVariableColumns + 1) * 15);
    // doc.text("Exam Fees", x, 220);
    // posXofCells.push(x);
    // doc.moveTo(x - 5, 60).lineTo(x - 5, doc.page.height - 60);

    // x += width(doc, "Exam Fees") + 5;
    // doc.text("Penalty", x, 220);
    // posXofCells.push(x);
    // doc.moveTo(x - 5, 60).lineTo(x - 5, doc.page.height - 60);

    // x += width(doc, "Penalty") + 5;
    doc.text("Total", x, 220);
    posXofCells.push(x);
    doc.moveTo(x - 5, 60).lineTo(x - 5, doc.page.height - 30);

    doc.save();
    doc.moveTo(15, 60).
        lineTo(doc.page.width - 15, 60).
        lineTo(doc.page.width - 15, doc.page.height - 30).
        lineTo(15, doc.page.height - 30).
        lineTo(15, 60).undash().stroke();

    doc.moveTo(15, 240).
        lineTo(doc.page.width - 15, 240).undash().stroke();

    doc.save();

    context.posXofCells = posXofCells;
}

function writeContents(fieldSpec, rowVector, doc, options, context) {
    // doc.font('Roboto')
    doc.fontSize(coord.headerFontSize);

    context.posY = 250;
    for (var i = 0; i < rowVector.length; i++) {

        for (var j = 0; j < rowVector[i].length; j++) {
            var x1 = context.posXofCells[j];
            var y1 = context.posY;

            if ((j >= 2) && (j < (context.numVariableColumns + 2)) && (rowVector[i][j])) {
                var yOffset = y1 - 8;
                doc.moveTo(x1, yOffset).lineTo(x1 + 10, yOffset).
                    lineTo(x1 + 10, yOffset + 15).lineTo(x1, yOffset + 15).
                    lineTo(x1, yOffset).fill("#AAAAAA");
            }

            doc.fillColor('black');
            doc.text(rowVector[i][j], x1 + 3, y1 - 4);

        }

        var h = height(doc, "test");
        doc.moveTo(15, context.posY + h).
            lineTo(doc.page.width - 15, context.posY + h).undash().stroke();

        context.posY += 20;
        if (i != (rowVector.length - 1)) {
            checkAndAdjustPageOverflow(fieldSpec, rowVector, doc, options, context)
        }

    }

    doc.save();

}

function checkAndAdjustPageOverflow(fieldSpec, rowVector, doc, options, context) {
    if (doc.y < (doc.page.height - 60)) {
        //we have enough space,
        return;
    }
    //Place the page connector here
    doc.font(coord.dataFont).text("CONT...", (doc.page.width - 100),
        doc.page.height - 20);

    doc.addPage();
    context.pageNo++;

    //write header
    writeHeader(fieldSpec, rowVector, doc, options, context);

    //write table header
    writeTableHeader(fieldSpec, rowVector, doc, options, context);

    context.posY = 250;

}

function center(doc, text) {
    var pageWidth = doc.page.width;
    var textWidth = doc.widthOfString(text);
    return (pageWidth / 2) - (textWidth / 2);
}

function rightAlign(doc, text, marginRight) {
    var pageWidth = doc.page.width;
    var textWidth = doc.widthOfString(text);
    return (pageWidth - marginRight - textWidth);
}

function width(doc, text) {
    return doc.widthOfString(text);
}

function height(doc, text) {
    return doc.heightOfString(text, width(doc, text));
}

module.exports.exportAllRecordsInOneFile = exportAllRecordsInOneFile;
