const fs = require('fs')
const names = process.argv.slice(2)[0]

if (!names) {
  console.error('------ error ------');
  console.error('例: npm run template test');
  console.error('------ end ------');
}
else {
  const Names = names.substring(0, 1).toUpperCase() + names.substring(1);
  let basepath = 'routes/'
  const path = [names]
  async function creatCpt() {
    try {
      // await exists(); // 检测文件夹
      await readFile(); // 读取模板内容
      await writeFile(await readFile()); //写入组件
      alterIndex();
      await alterSchema();
    }
    catch (err) {
      console.error(err);
    }
  }
  // 检测文件夹
  let exists = function () {
    return new Promise((res) => {
      (async function () {
        for (let a of path) {
          fs.existsSync(basepath + a) ? basepath = `${basepath}${a}/` : await mkdir(a);
        }
        res(basepath);
      })()
    })
  }
  // 创建文件夹
  let mkdir = function (a) {
    return new Promise((res, rej) => {
      fs.mkdir(basepath + a, (err) => {
        if (err) rej(err);
        basepath = `${basepath}${a}/`
        res(basepath);
      });
    })
  }
  // 读取文件内容
  let reads = [`/demo.js`];//要读取的文件
  let readFile = function () {
    let file = []
    return new Promise((res) => {
      for (let a of reads) {
        let text = fs.readFileSync('template/demo.js').toString();
        text = text.replace(/demo/g, names);
        text = text.replace(/Demo/g, Names)
        file.push(text)
      }
      res(file);
    })
  }
  let writeFile = function (file) {
    return new Promise((res, rej) => {
      (async function () {
        await fs.writeFile(`${basepath}${names}.js`,
          file[0], (err) => {
            if (err) rej(err)
          })
        res('succ');
      })()
    })
  }
  let alterIndex = function () {
    const indexPath = 'routes/index.js'
    return new Promise((res, rej) => {
      (async function () {
        let text = fs.readFileSync(indexPath).toString();
        if (!(text.indexOf(`require('./${names}')`) >= 0)) {
          text = text.substring(0, text.indexOf('module.exports') - 1) +
            `var ${names} = require('./${names}');` +
            text.substring(text.indexOf('module.exports') - 2, text.indexOf(']') - 1) +
            `
${names},
` + text.substring(text.indexOf(']'))
          fs.writeFile(indexPath,
            text, (err) => {
              if (err) rej(err)
            })
        }
        res('succ');
      })()
    })
  }

  let alterSchema = function () {
    const schemaPath = 'utils/schema.js'
    return new Promise((res, rej) => {
      (async function () {
        let text = fs.readFileSync(schemaPath).toString();
        if (!(text.indexOf(Names) >= 0)) {
          text = text.substring(0, text.indexOf('export {') - 1) +
            `
// ${names}
var ${Names}ModelSchema = new Schema({
  title: String,
  updated_at: Date,
  created_at: Date
});
const ${Names}Model = mongoose.model('${Names}', ${Names}ModelSchema);
new ${Names}Model()
` + text.substring(text.indexOf('export {') - 2, text.indexOf('// insert') - 1) +
            ` ${Names}Model,
  ` + text.substring(text.indexOf('// insert'))
          fs.writeFile(schemaPath,
            text, (err) => {
              if (err) rej(err)
            })
        }
        res('succ');
      })()
    })
  }
  creatCpt()
}