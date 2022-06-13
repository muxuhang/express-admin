console.log('脚本创建文件');
const name = process.argv.slice(2)[0]
const basepath = '/routes/'
async function creatCpt() {
  try {
    await exists(); // 检测文件夹
    await readFile(); // 读取模板内容
    await writeFile(await readFile()); //写入组件
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
let reads = [`${basepath}cptTemp/index.js`, `${basepath}cptTemp/cptTemp.js`];//要读取的文件
let readFile = function () {
  return new Promise((res) => {
    for (let a of reads) {
      let text = fs.readFileSync(a).toString();
      text = text.replace(/time/g, moment().format('YYYY/MM/DD'))
        .replace(/temp/g, name);
      file.push(text)
    }
    res(file);
  })
}

let writes = [`${name}.js`, `${name}.html`, `${name}.less`, `index.js`];
let writeFile = function (file) {
  return new Promise((res, rej) => {
    (async function () {
      for (let a of writes) {
        await fs.writeFile(`${basepath}${a}`,
          a == writes[3] ? file[0] : a == writes[0] ? file[1] : '', (err) => {
            if (err) rej(err)
          })
      }
      res('succ');
    })()
  })
}