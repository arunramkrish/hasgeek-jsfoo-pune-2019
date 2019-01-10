var fs = require('fs');
var appLogger = require('../../logging/appLogger');
var PDFDocument = require('pdfkit');
var moment = require('moment');
var feesUtil = require('../../utilities/feesUtil');

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function writeRow(fieldSpec, rowVector, doc, options, context, callback) {
    var outputFileName = options.outputFileName;

    if (!doc) {
        doc = new PDFDocument(options);
        doc.pipe(fs.createWriteStream(outputFileName));
    }

    if (!context.pageNo) {
        context.pageNo = 0;
        doc.y = 0;
    }

    //do all the jiginas - header, tableHeader - if we need or are on a fresh page
    var adjusted = checkAndAdjustPageOverflow(fieldSpec, rowVector, doc, options, context);

    if (adjusted) {
        //write column contents, if required with page breaks
        writeContents(fieldSpec, rowVector, doc, options, context);
    }

    callback(null, doc);
}

function writeHeader(fieldSpec, rowVector, doc, options, context) {
    doc.font(options.coord.labelFont);
    doc.fontSize(options.coord.titleFontSize)
        .text(options.reportTitle, center(doc, options.reportTitle), 20);
}

function writeTableHeader(fieldSpec, rowVector, doc, options, context) {
    doc.font(options.coord.labelFont);
    doc.fontSize(options.coord.headerFontSize);

    var posXofCells = [];

    var x = options.coord.marginLeft + options.coord.textPaddingLeft;

    fieldSpec.columnLabels.forEach(function (label, colIndex) {
        if (colIndex > 0) {
            //move to location after the previous column width
            x += (fieldSpec.columnWeights[colIndex - 1] / 100) * (doc.page.width - (options.coord.marginLeft * 2));

            //draw a column / vertical line before starting to write
            doc.moveTo(x - options.coord.textPaddingLeft, options.coord.marginTop).lineTo(x - options.coord.textPaddingLeft, doc.page.height - options.coord.marginTop);
        }
        doc.text(label, x, options.coord.marginTop + options.coord.textPaddingTop);
        posXofCells.push(x);

    });

    doc.save();

    doc.moveTo(options.coord.marginLeft, options.coord.marginTop).
        lineTo(doc.page.width - options.coord.marginLeft, options.coord.marginTop).
        lineTo(doc.page.width - options.coord.marginLeft, doc.page.height - options.coord.marginTop).
        lineTo(options.coord.marginLeft, doc.page.height - options.coord.marginTop).
        lineTo(options.coord.marginLeft, options.coord.marginTop).undash().stroke();

    var endYOfHeader = options.coord.marginTop + height(doc, fieldSpec.columnLabels[0]) + options.coord.textPaddingTop;
    doc.moveTo(options.coord.marginLeft, endYOfHeader).
        lineTo(doc.page.width - options.coord.marginLeft, endYOfHeader).undash().stroke();

    doc.save();

    context.posXofCells = posXofCells;
}

function writeContents(fieldSpec, rowVector, doc, options, context) {
    // doc.font('Roboto')
    doc.fontSize(options.coord.contentFontSize);
    var maxRowHeight = 0;

    fieldSpec.columnLabels.forEach(function (label, colIndex) {
        var colWidth = (fieldSpec.columnWeights[colIndex] / 100) * (doc.page.width - (options.coord.marginLeft * 2));
        var colX = context.posXofCells[colIndex];
        var colY = context.posY;
        var colHeight = 0;

        rowVector[colIndex].forEach(function (content, index) {
            var contentStyle = content.style;
            var contentText = content.text;

            if ((contentStyle) && ((contentStyle == "bold") || (contentStyle == "heading"))) {
                doc.font(options.coord.labelFont);
            } else {
                doc.font(options.coord.dataFont);
            }
            var textHeight = heightOfWrappedString(doc, contentText, colWidth - options.coord.textPaddingLeft, 50);
            if ((doc.y + textHeight + options.coord.textPaddingLeft) > (doc.page.height - (options.coord.textPaddingTop * 2))) {
                console.log("Col index " + colIndex + " Y " + doc.y + " textHeight " + textHeight + " padding " + options.coord.textPaddingTop + " height " + doc.page.height);
            }
            doc.text(contentText, colX, colY + options.coord.textPaddingTop, { width: colWidth - options.coord.textPaddingLeft, lineSpacing: 50 });


            colY += textHeight + options.coord.textPaddingTop;
            colHeight += textHeight + options.coord.textPaddingTop;
        });

        if (colHeight > maxRowHeight) {
            maxRowHeight = colHeight;
        }

    });
    context.posY += maxRowHeight + options.coord.textPaddingTop;

    var endYOfContent = context.posY;
    doc.moveTo(options.coord.marginLeft, endYOfContent).
        lineTo(doc.page.width - options.coord.marginLeft, endYOfContent).undash().stroke();

    doc.font(options.coord.dataFont);
    doc.save();

}

function writeContentsPartial(fieldSpec, rowVector, doc, options, context) {
    // doc.font('Roboto')
    doc.fontSize(options.coord.contentFontSize);
    var maxRowHeight = 0;
    
    var partialRowVector = [];
    var partialContentPresent =false;

    fieldSpec.columnLabels.forEach(function (label, colIndex) {
        partialRowVector.push([]);

        var colWidth = (fieldSpec.columnWeights[colIndex] / 100) * (doc.page.width - (options.coord.marginLeft * 2));
        var colX = context.posXofCells[colIndex];
        var colY = context.posY;
        var colHeight = 0;

        if (colIndex == 0) {
            //as this is title content, include content by default
            partialRowVector[colIndex].push(rowVector[colIndex]);
        }

        rowVector[colIndex].forEach(function (content, index) {
            var contentStyle = content.style;
            var contentText = content.text;

            if ((contentStyle) && ((contentStyle == "bold") || (contentStyle == "heading"))) {
                doc.font(options.coord.labelFont);
            } else {
                doc.font(options.coord.dataFont);
            }

            var textHeight = heightOfWrappedString(doc, contentText, colWidth - options.coord.textPaddingLeft);
            var availableHeight = (doc.page.height - (options.coord.marginTop * 2) - 20) - colY;

            if (textHeight < availableHeight) {
                //we are able to accommodate in availabeHeight
                doc.text(contentText, colX, colY + options.coord.textPaddingTop, { width: colWidth - options.coord.textPaddingLeft });

                colY += textHeight + options.coord.textPaddingTop;
                colHeight += textHeight + options.coord.textPaddingTop;
    
            } else {
                partialContentPresent = true;

                var clippingHeight = availableHeight - textHeight;
                var contentSplits = splitContent(doc, content, colWidth, textHeight, availableHeight);

                //add remaining content to partials
                var partialContentArray = [];
                rowVector[colIndex].forEach(function(c, i) {
                    if (i < index) {
                        //content already added, so dont include them
                        return;
                    }

                    if (i == index) {
                        //add the residual content
                        partialContentArray.push(contentSplits[1]);
                        return;
                    }

                    //add the remaining content below it
                    partialContentArray.push(c);
                });
                partialRowVector[colIndex].push(partialContentArray);

                //write content - first part
                contentStyle = contentSplits[0].style;
                contentText = contentSplits[0].text;
                
                if ((contentStyle) && ((contentStyle == "bold") || (contentStyle == "heading"))) {
                    doc.font(options.coord.labelFont);
                } else {
                    doc.font(options.coord.dataFont);
                }
                doc.text(contentText, colX, colY + options.coord.textPaddingTop, { width: colWidth - options.coord.textPaddingLeft });

            }
        });

        if (colHeight > maxRowHeight) {
            maxRowHeight = colHeight;
        }

    });
    context.posY += maxRowHeight + options.coord.textPaddingTop;

    var endYOfContent = context.posY;
    doc.moveTo(options.coord.marginLeft, endYOfContent).
        lineTo(doc.page.width - options.coord.marginLeft, endYOfContent).undash().stroke();

    doc.font(options.coord.dataFont);
    doc.save();

    return (partialContentPresent) ? partialRowVector : null;
}

function splitContent(doc, content, colWidth, textHeight, availableHeight) {
    var contentText = content.text;
    var singleLineHeight = height(doc, contentText);
    var contentWidth = width(doc, contentText);

    var numLinesRequired = Math.ceil(contentWidth / colWidth);
    var contentLength = contentText.length;

    var numLinesThatCanBeAccommodated = Math.floor(availableHeight / singleLineHeight);
    var charsPerLine = Math.floor((contentLength / contentWidth) * colWidth);

    var numCharsThatCanBeAccommodated = charsPerLine * numLinesThatCanBeAccommodated;;

    var text1 = contentText.substring(0, numCharsThatCanBeAccommodated) + " - ";
    var text2 = " - " + contentText.substring(numCharsThatCanBeAccommodated + 1);

    var splits = [];
    var content1 = JSON.parse(JSON.stringify(content));
    var content2 = JSON.parse(JSON.stringify(content));
    content1.text = text1;
    content2.text = text2;

    splits.push(content1);
    splits.push(content2);

    return splits;
}

function checkAndAdjustPageOverflow(fieldSpec, rowVector, doc, options, context) {
    //ensure we have enough space by comparing height of each column
    var maxColHeight = options.coord.rowHeight;

    rowVector.forEach(function (colData, colIndex) {
        var colHeight = 0;
	console.log("Doc " + doc);
	console.log("Page " + doc.page);
        var columnWidth = (fieldSpec.columnWeights[colIndex] / 100) * (doc.page.width - (options.coord.marginLeft * 2));

        //colData contains array for each content to be placed one below the other, sum them up
        colData.forEach(function (content) {
            var contentStyle = content.style;
            var contentText = content.text;

            if ((contentStyle) && ((contentStyle == "bold") || (contentStyle == "heading"))) {
                doc.font(options.coord.labelFont);
            } else {
                doc.font(options.coord.dataFont);
            }

            var contentHeight = heightOfWrappedString(doc, contentText, columnWidth - options.coord.textPaddingLeft);
            colHeight += contentHeight + options.coord.textPaddingTop;
        });

        if (colHeight > maxColHeight) {
            maxColHeight = colHeight;
        }
    });
    context.currentRowHeight = maxColHeight;

    //reset font
    doc.font(options.coord.dataFont);

    if ((doc.y != 0) && ((doc.y + context.currentRowHeight) < (doc.page.height - (options.coord.marginTop * 2) - 20))) {
        //we have enough space to write current content / row, so no need to write header
        return true;
    } else if (context.currentRowHeight > (doc.page.height - (options.coord.marginTop * 2) - 20)) {
        //handle this scenario by writing partials
        var remainingRowVector = writeContentsPartial(fieldSpec, rowVector, doc, options, context);
        while (remainingRowVector) {
            //move to next page
            //Place the page connector here
            doc.font(options.coord.dataFont).text("CONT...", (doc.page.width - 100),
                doc.page.height - 20);

            doc.addPage();
            context.pageNo++;

            //write header
            writeHeader(fieldSpec, rowVector, doc, options, context);

            //write table header
            writeTableHeader(fieldSpec, rowVector, doc, options, context);

            var endYOfHeader = options.coord.marginTop + height(doc, fieldSpec.columnLabels[0]) + options.coord.textPaddingTop;

            context.posY = endYOfHeader;

            remainingRowVector = writeContentsPartial(fieldSpec, remainingRowVector, doc, options, context);
        }
        return false;
    }

    if (context.pageNo != 0) {
        //handle this only for contunuing page

        //Place the page connector here
        doc.font(options.coord.dataFont).text("CONT...", (doc.page.width - 100),
            doc.page.height - 20);

        doc.addPage();
    }

    context.pageNo++;

    //write header
    writeHeader(fieldSpec, rowVector, doc, options, context);

    //write table header
    writeTableHeader(fieldSpec, rowVector, doc, options, context);

    var endYOfHeader = options.coord.marginTop + height(doc, fieldSpec.columnLabels[0]) + options.coord.textPaddingTop;

    context.posY = endYOfHeader;

    return true;
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
    return doc.heightOfString(text, { width: width(doc, text) });
}

function heightOfWrappedString(doc, text, width, lineSpacing) {
    var options = {
        width: width
    }
    if (lineSpacing) {
        options.lineSpacing = lineSpacing;
    }
    return doc.heightOfString(text, options);
}

module.exports.writeRow = writeRow;
