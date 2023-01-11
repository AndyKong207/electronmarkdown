const { app, BrowserWindow, Menu } = require('electron')
const isDev = require('electron-is-dev')
const Store = require('electron-store')
const menuTemp = require('./src/temp/menuTemp')

Store.initRenderer()

let mainWindow

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 650,
    minWidth: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })

  const urlLocation = isDev ? "http://localhost:3000" : 'myUrl'

  mainWindow.loadURL(urlLocation)

  // 添加自定义的原生菜单
  const menu = Menu.buildFromTemplate(menuTemp)
  Menu.setApplicationMenu(menu)
})