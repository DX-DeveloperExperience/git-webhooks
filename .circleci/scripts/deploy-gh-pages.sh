# abort on errors
set -e

VERSION=$1

cd ../..

echo "> chmod +x"
chmod +x ./node_modules/vuepress/bin/vuepress.js

echo "> ./node_modules/vuepress/bin/vuepress.js build docs"
./node_modules/vuepress/bin/vuepress.js build docs

#echo "> sudo npm run docs:build"
# build
#sudo npm run docs:build

echo "> cd docs/.vuepress/dist"
# navigate into the build output directory
cd docs/.vuepress/dist

git init
git add -A
git commit -m "deploy $VERSION"

# if you are deploying to https://<USERNAME>.github.io/<REPO>
git push -f git@github.com:DX-DeveloperExperience/git-webhooks.git master:gh-pages

cd -