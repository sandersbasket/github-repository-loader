const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const async = require('async');
const path = require('path');
const prompt = require('prompt-sync')();
let jsonData = require('./config.json');


const octokit = new Octokit({
  auth: jsonData.token,
});


function getFiles(dirPath, callback) {

    fs.readdir(dirPath, function (err, files) {
        if (err) return callback(err);

        var filePaths = [];
        async.eachSeries(files, function (fileName, eachCallback) {
            var filePath = path.join(dirPath, fileName);

            fs.stat(filePath, function (err, stat) {
                if (err) return eachCallback(err);

                if (stat.isDirectory()) {
                    getFiles(filePath, function (err, subDirFiles) {
                        if (err) return eachCallback(err);

                        filePaths = filePaths.concat(subDirFiles);
                        eachCallback(null);
                    });

                } else {
                    if (stat.isFile() && /.txt$/.test(filePath)) {
                        filePaths.push(filePath);
                    }

                    eachCallback(null);
                }
            });
        }, function (err) {
            callback(err, filePaths);
        });

    });
}

async function createRepos(repos_name, description) {
    console.log('Create repos: ' + repos_name)
    await octokit.rest.repos.createForAuthenticatedUser({
        name: repos_name,
        description: description,
        auto_init: true,
        has_issues: false,
        license_template: jsonData.license_template
    });
}

async function setStarRepos(owner, repos_name) {
    octokit.rest.activity.starRepoForAuthenticatedUser({
        owner: owner,
        repo: repos_name,
    });
}

async function uploadFileRepos(owner, repos_name, content, path, commit, email, sha = undefined) {
    console.log('Uploaded file in repos: ' + repos_name)
    if (sha != undefined) {
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: owner,
            repo: repos_name,
            path: path,
            content: content,
            message: commit,
            committer: {
                name: owner,
                email: email
            },
            author: {
                name: owner,
                email: email
            },
            sha: sha
        })
    } else {
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: owner,
            repo: repos_name,
            path: path,
            content: content,
            message: commit,
            committer: {
                name: owner,
                email: email
            },
            author: {
                name: owner,
                email: email
            }
        })
    }
}

async function getFileInfo(owner, repos_name,  path) {
    let info = await octokit.rest.repos.getContent({
        owner: owner,
        repo: repos_name,
        path: path,
    });
    return info.data.sha
}

async function setTopics(owner, repos, topics_array) {
    console.log('Send topics in repos: ' + repos)
    await octokit.rest.repos.replaceAllTopics({
        owner: owner,
        repo: repos,
        names: topics_array,
    });
}

function getDirectories(path) {
    return fs.readdirSync(path).filter(function (file) {
      return fs.statSync(path+'/'+file).isDirectory();
    });
}

function getAnyFiles(directories) {
    let fileName = null
    console.log(directories)
    fs.readdirSync('./folders/' + directories).forEach(file => {
        if (path.extname(file) != '.txt') {
            fileName = file
        }
    })
    console.log(fileName)
    return fileName
}

function deleteRepos(owner, repos_name) {
    octokit.rest.repos.delete({
        owner: owner,
        repo: repos_name,
    });
}


let directoriesList = getDirectories('./folders')

async function index() {
    const mode = prompt('Delete all repos or not? [Y/N]: ');
    if (mode == 'Y') {
        for (directories of directoriesList) {
            console.log('Delete Directories: ' + directories)
            getFiles('./folders/' + directories, async function (err, files) {
                let repos_name = null
                for (file of files) {
                    if (path.basename(file) == 'Repository name.txt') {
                        repos_name = fs.readFileSync(file).toString()
                    }
                }
                repos_name = repos_name.replace(/ /g, '-')
                deleteRepos(jsonData.username, repos_name)
            })
        }
    } else if (mode == 'N') {
        for (directories of directoriesList) {
            console.log('Uploaded Directories: ' + directories)
            let repos_name = null
            let description = null
            let readme = null
            let topics = null
            let anyFile = fs.readFileSync('./folders/' + directories + '/' + getAnyFiles(directories)).toString('base64');
            let fileName = getAnyFiles(directories)
            await getFiles('./folders/' + directories, async function (err, files) {
                for (file of files) {
                    if (path.basename(file) == 'description.txt') {
                        description = await fs.readFileSync(file).toString()
                    } else if (path.basename(file) == 'readme.txt') {
                        readme = await fs.readFileSync(file).toString('base64')
                    } else if (path.basename(file) == 'Repository name.txt') {
                        repos_name = await fs.readFileSync(file).toString()
                    } else if (path.basename(file) == 'topics.txt') {
                        topics = await fs.readFileSync(file).toString().split(/\r\n|\r|\n/);
                    }
                }
                await createRepos(repos_name, description)
                repos_name = repos_name.replace(/ /g, '-')
                setStarRepos(jsonData.username, repos_name)
                setTopics(jsonData.username, repos_name, topics)
                sha = await getFileInfo(jsonData.username, repos_name, 'README.md')
                await uploadFileRepos(jsonData.username, repos_name, readme, 'README.md', jsonData.commit_message, jsonData.email, sha)
                uploadFileRepos(jsonData.username, repos_name, anyFile, fileName, jsonData.commit_message, jsonData.email)
            })
        }
    } else {
        console.log('PLS USE ONLY Y/N')
    }
}

index()





