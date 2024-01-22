const fsPromises = require('node:fs/promises');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'project-dist');
const templateFile = path.join(__dirname, 'template.html');
const componentsPath = path.join(__dirname, 'components');
const stylesPath = path.join(__dirname, 'styles');
const distStyles = path.join(distDir, 'style.css');

async function createDistFolder(dist) {
  await fsPromises.rm(dist, { recursive: true, force: true });
  await fsPromises.mkdir(dist, { recursive: true });
}

async function createHtml(template, components, dist) {
  try {
    let dataTemplate = await fsPromises.readFile(
      template,
      { encoding: 'utf8' }
    );

    const componentsFromTemplate = [...dataTemplate.matchAll(/{{(.*)}}/g)].map(e => e[1]);

    const componentsFiles = await fsPromises.readdir(components, { withFileTypes: true });
    const componentsData = {};
    for (const file of componentsFiles) {
      if (file.isFile()) {
        const { name, ext } = path.parse(file.name);
        if (ext === '.html') {
          const data = await fsPromises.readFile(
            path.resolve(file.path, file.name),
            { encoding: 'utf8' }
          );
          componentsData[name] = data;
        }
      }
    }

    for (const component of componentsFromTemplate) {
      const regexp = new RegExp(`{{${component}}}`, 'g');
      dataTemplate = dataTemplate.replaceAll(regexp, componentsData[component]);
    }

    const writableStream = fs.createWriteStream(path.join(dist, 'index.html'));
    writableStream.write(dataTemplate);
  } catch (err) {
    console.error(err);
  }
}

async function bundleStyles(sourcePath, distFile) {
  try {
    const files = await fsPromises.readdir(sourcePath, { withFileTypes: true });
    const stylesArr = [];
    for (const file of files) {
      if (file.isFile()) {
        const { ext } = path.parse(file.name);
        if (ext === '.css') {
          const data = await fsPromises.readFile(
            path.resolve(file.path, file.name),
            { encoding: 'utf8' }
          );
          stylesArr.push(data);
        }
      }
    }

    const writableStream = fs.createWriteStream(distFile);
    writableStream.write(stylesArr.join(''));
  } catch (err) {
    console.error(err);
  }
};

async function buidPage(dist, template, components, styles, distStyle) {
  await createDistFolder(dist);
  await createHtml(template, components, dist);
  bundleStyles(styles, distStyle)
}

buidPage(distDir, templateFile, componentsPath, stylesPath, distStyles);