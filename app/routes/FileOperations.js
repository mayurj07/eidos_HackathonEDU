/**
 * Created by mjain on 6/29/15.

 Refer these links for better understanding Callbacks
 and how to return value from functions in NodeJS:

 1. http://stackoverflow.com/questions/23339907/returning-a-value-from-callback-function-in-node-js

 2. https://github.com/maxogden/art-of-node#callbacks


 NOTE :::::: Don't delete the comments written on this page !!
 */

var fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    crypto = require('crypto'),
    config = require('../config.json'),
    uploadsPath = config.uploadsFolderRelativePath,
    resultsFolder = config.analyticsResultsFolderRelativePath;


exports.upload = function (req, res) {
    var file = req.files.file;
    var logedUsername = req.body.data;
    /*console.log(file.name);
     console.log(file.type);
     console.log(file.path);*/
    var UserFiles = req.app.db.models.UserFiles;
    var User = req.app.db.models.User;
    var fileMap = req.app.db.models.filemap;

    fileMap.find({"username": logedUsername, "filename": file.name}, function (err, filemapRes) {
        if(filemapRes == 0){
            fs.readFile(file.path, function (err, data) {
                if (!err) {
                    var fileHash = crypto.createHash('md5').update(data).digest("hex");
                    var fileExtension = path.extname(file.path);
                    fileHash = fileHash + fileExtension;
                    var savePath = path.join(__dirname, uploadsPath, fileHash);
                    fs.writeFile(savePath, data, function (err) {
                        if (err) {
                            console.log('Error writing file. ' + err);
                            res.status(500).send('Unable to write file to: ' + savePath);
                            return;
                        }
                        else {
                            var fileMapping = new fileMap({
                                username: logedUsername,
                                filename: file.name,
                                hashname: path.basename(savePath)
                            });

                            fileMapping.save(function(fileMapErr, doc){
                                if(fileMapErr){
                                    console.log('Error while saving the file mapping information.');
                                    return res.status(500).send('Error saving file mapping details of uploaded file: ' + err);
                                }
                            });

                            UserFiles.find({ "files.name": file.name, "username": logedUsername}, function(err, checkFile){
                                if(checkFile.length == 0) {
                                    saveFileDetails(savePath, file.name);
                                    fs.unlinkSync(file.path);
                                    res.status(200);
                                    return;
                                }
                                else {
                                    console.log('File Already Exists.');
                                    res.status(200).send('File Already Exists.');
                                    return;
                                }
                            });
                        }
                    });        //end of writeFile
                } else {
                    console.log(err);
                    res.status(500).send('Error reading file.');
                    return;
                }
            });

        }
        else{
            console.log('file mapping found.');


        }
    });

    function saveFileDetails(filePath, originalFileName) {

        var stat = fs.statSync(filePath);
        var fileSizeInBytes = stat["size"];
        var fileSizeInMegabytes = fileSizeInBytes / 1000000.0; //Convert the file size to megabytes (optional)

        //********************* READ large file synchronously into chunks ***********************
        //http://stackoverflow.com/questions/7545147/nodejs-synchronization-read-large-file-line-by-line
        //logic to read the file synchronously in chunks and coun the total number of lines
        var rowCount = 0;
        var fd = fs.openSync(filePath, 'r');
        var bufferSize = 1024;
        var buffer = new Buffer(bufferSize);
        var leftOver = '';
        var read, line, idxStart, idx;
        while ((read = fs.readSync(fd, buffer, 0, bufferSize, null)) !== 0) {
            leftOver += buffer.toString('utf8', 0, read);
            idxStart = 0;
            while ((idx = leftOver.indexOf("\n", idxStart)) !== -1) {
                line = leftOver.substring(idxStart, idx);
                //console.log("one line read: " + line);
                ++rowCount;
                idxStart = idx + 1;
            }
            leftOver = leftOver.substring(idxStart);
        }
        //*********************END of Read large file synchronously into chunks ***************

        User.findOne({username: logedUsername}, function (err, doc) {
            if (err) return res.send(500, err);
            if (doc) {
                var username = doc.username;
                UserFiles.findOne({username: username}, function (err, userfileDoc) {
                    if (err) {
                        console.log('Error finding user in userFiles Db');
                        return res.status(500).send('Error User not found: ' + err);
                    }

                    if (!userfileDoc) {
                        // console.log('creating a new doc in userFiles DB');
                        var userfile = new UserFiles({
                            username: username,
                            files: [{
                                name: originalFileName,
                                size: fileSizeInMegabytes,
                                typeinfo: {
                                    basetype: path.extname(filePath),
                                    mimetype: mime.lookup(filePath)
                                },
                                rowCount: rowCount
                            }]
                        });
                        userfile.save(function (err, doc) {
                            if (err) return res.status(500).send('Error saving details of uploaded file: ' + err);
                            // console.log('Saved file details in mongoDB: ' + doc);
                        });
                    }
                    else {       //docs exists with that username in userFiles collection
                        // console.log('user '+username +'  found in userFiles DB');
                        UserFiles.findOne({
                            "files.name": originalFileName,
                            "username": username
                        }, function (err, queryResult) {
                            if (!queryResult) {

                                //  console.log('file not found in mjain db so adding file.');
                                userfileDoc.files.push({
                                    name: originalFileName,
                                    size: fileSizeInMegabytes,
                                    typeinfo: {basetype: path.extname(filePath), mimetype: mime.lookup(filePath)},
                                    rowCount: rowCount
                                });
                                userfileDoc.save(function (err, doc) {
                                    if (err) {
                                        console.log('error in adding one more file. Sending 500: ' + err);
                                        return res.status(500).send('Error saving details of uploaded file: ' + err);
                                    }
                                    //  console.log('Added one more file to mjain: ' + doc);
                                });
                            }
                            else {
                                // console.log('deleting the file: ' + originalFileName);
                                UserFiles.update({"username": logedUsername}, {$pull: {"files": {"name": originalFileName}}}, function (err, deletedFile) {
                                    if (err) console.log('ERROR in deleting the sub doc' + err);
                                    else {
                                        queryResult.files.push({
                                            name: originalFileName,
                                            size: fileSizeInMegabytes,
                                            typeinfo: {
                                                basetype: path.extname(filePath),
                                                mimetype: mime.lookup(filePath)
                                            },
                                            rowCount: rowCount
                                        });
                                        queryResult.save(function (err, cb) {
                                            if (err)
                                                console.log('Error: could not overwrite the file: ' + err);
                                            // console.log('file overwritten successfully.');
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                return res.status(400).send('Username not found while saving file details');
            }
        });
    }

};


exports.listFilesInDirectory = function (req, res) {

    var UserFiles = req.app.db.models.UserFiles;
    var fileMap = req.app.db.models.filemap;
    var logedUsername = req.query.data;
    var results = [];

    fileMap.find({"username": logedUsername}, function (err, filemapRes) {
        if(filemapRes != 0){
            UserFiles.find({username: logedUsername}, function (err, filesofUser) {
                if (err) {
                    console.log('error finding user in userFiles Db');
                    return res.status(500).send('Error in finding user: ' + err);
                }
                else {
                    if (filesofUser[0] != undefined) {
                        //console.log(filesofUser);
                        var filesArray = filesofUser[0].files;
                        //console.log(filesArray);

                        for (var i = 0; i < filesArray.length; i++) {
                            results.push
                            ({
                                name: filesArray[i].name,
                                sizeMB: filesArray[i].size,
                                type: filesArray[i].typeinfo.basetype,
                                mimeType: filesArray[i].typeinfo.mimetype,
                                rows: filesArray[i].rowCount
                            });
                        }
                        //console.log(results);
                        res.status(200).send(results);
                    }
                    else {
                        //results.push({});
                        res.status(204).send();
                    }

                }
            });
        }
        else {
            //results.push({});
            res.status(204);
        }
    });


};


exports.deleteFile = function (req, res) {

    var fileToDelete = req.body.fileName;
    var UserFilesDir = path.join(__dirname, uploadsPath);
    var ResultFilesdir = path.join(__dirname, resultsFolder);
    var UserFiles = req.app.db.models.UserFiles;
    var ResultFiles = req.app.db.models.ResultFiles;
    var fileMap = req.app.db.models.filemap;
    var logedUsername = req.body.data;

    fileMap.find({"username": logedUsername, "filename": fileToDelete}, function (err, filemapRes) {
        if(filemapRes != 0){
            //console.log(filemapRes[0]['hashname']);
            fileToDelete = filemapRes[0]['hashname'];
            var originalFileName = filemapRes[0]['filename'];

            fs.readdirSync(ResultFilesdir).forEach(function (file) {
                var inputFile = originalFileName;
                var outputFile = path.basename(file);

                ResultFiles.find({username: logedUsername, "files.inputFile": inputFile}, function(err, resFiles){
                    if (resFiles[0] != undefined) {
                        //console.log(resFiles);
                        var filesArray = resFiles[0].files;

                        for (var j = 0; j < filesArray.length; j++) {
                            if (filesArray[j].inputFile == inputFile) {
                                for (var k = 0; k < filesArray[j].outputFiles.length; k++) {

                                    if(filesArray[j].outputFiles[k].outputFile == outputFile)
                                    {
                                        var filepath = ResultFilesdir + '/' + outputFile;
                                        fs.unlinkSync(filepath);
                                        ResultFiles.update({ username: logedUsername, "files.inputFile": originalFileName}, {$pull: {"files": {"inputFile": originalFileName}}}, function (err, result) {
                                            if (err) console.log(err);
                                        });
                                        console.log('deleted output file: ' + outputFile);
                                    }
                                }
                                break;
                            }
                        }
                    }
                });

            });

            fs.readdirSync(UserFilesDir).forEach(function (file) {
                if (path.basename(file) == fileToDelete) {
                    fileMap.remove({"username": logedUsername, "filename": originalFileName}, function(err, deletedDoc){
                        fileMap.count({"hashname": fileToDelete}, function(err, hashFileCount){
                            console.log('hashFileCount: '+ hashFileCount);
                            if(hashFileCount == 0) {
                                var filepath = UserFilesDir + '/' + fileToDelete;
                                fs.unlinkSync(filepath);
                            }
                        });
                    });
                    UserFiles.update({"username": logedUsername}, {$pull: {"files": {"name": originalFileName}}}, function (err, result) {
                        if (err) console.log(err);
                        res.status(200).send(true);
                    });


                }
            });


        }
    });

};


exports.sendFile = function (req, res) {
    var downloadFileName = req.body.downloadFile;
    var dFilePath = path.join(__dirname, resultsFolder, downloadFileName);
    console.log(dFilePath);
    var stat = fs.statSync(dFilePath);
    var fileSizeInBytes = stat["size"];
    var mimetype = mime.lookup(dFilePath);

    /*
    fs.readFile(dFilePath, function(err, data){
        if(err) throw err;

        res.setHeader('Content-Length', fileSizeInBytes);
        res.setHeader('Content-Type', mimetype);
        res.setHeader('Content-Disposition', 'attachment; filename=' + downloadFileName);
        res.write(data);
        res.end();
    });*/

    res.setHeader('Content-Length', fileSizeInBytes);
    res.setHeader('Content-Type', mimetype);
    res.setHeader('Content-Disposition', 'attachment; filename=' + downloadFileName);

    var readStream = fs.createReadStream(dFilePath);
    readStream.pipe(res);

};
