# github-repository-loader
Github script for automatic loading of repositories implemented using the GitHub REST API.
The script is able to upload a readme file, any files that are in the folder, create a repository, and change the file README.md

Most importantly, there are no restrictions on the number of repositories downloaded.
#### The name of all files below is required in the folder!
- description.txt (responsible for repository description)
- Repository name.txt (responsible for the repository name)
- readme.txt (responsible for the contents of the README.md)
- topics.txt (responsible for tags in the repository)

#### Requirements:
- npm i prompt-sync
- npm i async
- npm i fs
- npm i @octokit/rest
