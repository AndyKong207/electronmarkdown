import { v4 } from 'uuid'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import 'bootstrap/dist/css/bootstrap.min.css'
import SearchFile from './components/SearchFile'
import initFiles from './utils/initFiles'
import FileList from './components/FileList'
import ButtonItem from './components/ButtonItem'
import { faFileImport, faPlus } from '@fortawesome/free-solid-svg-icons'
import TabList from './components/TabList'
import SimpleMDE from "react-simplemde-editor"
import "easymde/dist/easymde.min.css"
import { mapArr, objToArr, readFile, writeFile, renameFile, deleteFile } from './utils/helper'
import useIpcRenderer from './hooks/useIpcRenderer'

const path = window.require('path')
const { remote, ipcRenderer } = window.require('electron')
const Store = window.require('electron-store')

const fileStore = new Store({ "name": "filesInfo" })

// 定义方法实现具体属性的持久化存储
const saveInfoToStore = (files) => {
  const storeObj = objToArr(files).reduce((ret, file) => {
    const { id, title, createTime, path } = file
    ret[id] = {
      id,
      path,
      title,
      createTime
    }
    return ret
  }, {})
  fileStore.set('files', storeObj)
}

// 自定义左侧容器
let LeftDiv = styled.div.attrs({
  className: 'col-3 left-panel'
})`
  position: relative;
  background-color: #7b8c7c;
  min-height: 100vh;
  .btn_list{
    left: 0;
    bottom: 0;
    width: 100%;
    position: absolute;
    p{
      border: 0;
      width: 50%;
      color: #fff;
      border-radius: 0;
      margin-bottom: 0!important;
    }
    p:nth-of-type(1){
      background-color: #8ba39e;
    }
    p:nth-of-type(2){
      background-color: #98b4b3;
    }
  }
`

// 自定义右侧容器
let RightDiv = styled.div.attrs({
  className: 'col-9 right-panel'
})`
  background-color: #c9d8cd;
  .init-page{
    color: #888;
    text-align:center;
    font: normal 28px/300px '微软雅黑';
  }
`

function App() {

  const [files, setFiles] = useState(fileStore.get('files') || {})  // 代表所有的文件信息
  const [activeId, setActiveId] = useState('')  // 当前正在编辑的文件id
  const [openIds, setOpenIds] = useState([]) // 当前已打开的所有文件信息 ids
  const [unSaveIds, setUnSaveIds] = useState([]) // 当前未被保存的所有文件信息 ids
  const [searchFiles, setSearchFiles] = useState([])  // 将左侧展示的搜索列表与默认列表信息进行区分

  // 自定义一个当前磁盘里存放文件的路径
  const savedPath = remote.app.getPath('documents') + '/testMk'
  console.log(remote.app.getPath('userData'))

  // 计算已打开的所有文件信息
  const openFiles = openIds.map(openId => {
    return files[openId]
  })

  // 计算正在编辑的文件信息
  const activeFile = files[activeId]

  // 计算当前左侧列表需要展示什么样的信息
  const fileList = (searchFiles.length > 0) ? searchFiles : objToArr(files)

  // 01 点击左侧文件显示编辑页
  const openItem = (id) => {
    // 将当前 id 设置为 active id 
    setActiveId(id)
    // 点击某个文件项时读取它里面的内容显示
    const currentFile = files[id]
    if (!currentFile.isLoaded) {
      readFile(currentFile.path).then((data) => {
        const newFile = { ...currentFile, body: data, isLoaded: true }
        setFiles({ ...files, [id]: newFile })
      })
    }
    // 将id添加至 open ids
    if (!openIds.includes(id)) {
      setOpenIds([...openIds, id])
    }
  }

  // 02 点击某个选项时切换当前状态
  const changeActive = (id) => {
    setActiveId(id)
  }
  // 03 点击关闭按钮
  const closeFile = (id) => {
    // 将当前的 id 从已经 open 的数组中去除
    const retOpen = openIds.filter(openId => openId !== id)
    setOpenIds(retOpen)
    // 当某一个选项被关闭之后还需要给所有已打开文件设置一个当前状态
    if (retOpen.length > 0 && (activeId == id)) {
      setActiveId(retOpen[0])
    } else if (retOpen.length > 0 && (activeId !== id)) {
      setActiveId(activeId)
    }
    else {
      setActiveId('')
    }
  }

  // 04 当文件内容更新时
  const changeFile = (id, newValue) => {
    if (newValue !== files[id].body) {
      if (!unSaveIds.includes(id)) {
        setUnSaveIds([...unSaveIds, id])
      }
      const newFile = { ...files[id], body: newValue }
      setFiles({ ...files, [id]: newFile })
    }
  }

  // 05 删除某个文件项
  const deleteItem = (id) => {
    const file = files[id]
    if (!file.isNew) {
      deleteFile(file.path).then(() => {
        delete files[id]
        setFiles(files)
        saveInfoToStore(files)
        closeFile(id)
      })
    } else {
      delete files[id]
      setFiles(files)
      saveInfoToStore(files)
      closeFile(id)
    }
  }

  // 06 依据关键字搜索文件
  const searchFile = (keyWord) => {
    const newFiles = objToArr(files).filter(file => file.title.includes(keyWord))
    setSearchFiles(newFiles)
  }

  // 07 重命名
  const saveData = (id, newTitle, isNew) => {
    const item = objToArr(files).find(file => file.title == newTitle)
    if (item) {
      newTitle += '_copy'
    }
    const newPath = isNew ? path.join(savedPath, `${newTitle}.md`) : path.join(path.dirname(files[id].path), `${newTitle}.md`)
    const newFile = { ...files[id], title: newTitle, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: newFile }
    if (isNew) {
      // 执行创建
      writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveInfoToStore(newFiles)
      })
    } else {
      // 执行更新
      const oldPath = files[id].path
      renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveInfoToStore(newFiles)
      })
    }

  }

  // 08 新建操作
  const createFile = () => {
    const newId = v4()
    const newFile = {
      id: newId,
      title: '',
      isNew: true,
      body: '## 初始化内容',
      createTime: new Date().getTime()
    }
    let flag = objToArr(files).find(file => file.isNew)
    if (!flag) {
      setFiles({ ...files, [newId]: newFile })
    }
  }

  // 09 保存当前正在编辑的文件
  const saveCurrentFile = () => {
    writeFile(activeFile.path, activeFile.body).then(() => {
      setUnSaveIds(unSaveIds.filter(id => id !== activeFile.id))
    })
  }

  // 10 执行外部 md 文件导入
  const importFile = () => {
    remote.dialog.showOpenDialog({
      defaultPath: __dirname,
      buttonLabel: '请选择',
      title: '选择md文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { "name": "md文档", extensions: ["md"] },
        { "name": "其它类型", extensions: ["js", 'json', 'html'] },
      ]
    }).then((ret) => {
      const paths = ret.filePaths
      if (paths.length) {
        // 01 判断当前路径们，是否存在于 files 当中，如果已经存在则无须再执行导入操作
        const validPaths = paths.filter(filePath => {
          // 判断当前 path 是否已经存在过了
          const existed = Object.values(files).find(file => {
            return file.path == filePath
          })
          return !existed
        })

        // 02 将上述的路径信息组装成 files 格式， id title path 
        const packageData = validPaths.map(filePath => {
          return {
            id: v4(),
            title: path.basename(filePath, '.md'),
            path: filePath
          }
        })

        // 03 将上述的数据格式处理为 files 所需要的
        const newFiles = { ...files, ...mapArr(packageData) }

        // 04 更新数据重新渲染
        setFiles(newFiles)
        // TODO: 完成持久化操作
        saveInfoToStore(newFiles)

        // 05 成功导入提示
        if (packageData.length) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: "导入md文档",
            message: '文件导入成功'
          })
        }
      } else {
        console.log('未选择文件导入')
      }
    })
  }

  // 实现主进程与渲染进程的事件通信
  useIpcRenderer({
    'execute-create-file': createFile,
    'execute-import-file': importFile,
    'execute-save-file': saveCurrentFile,
  })

  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <LeftDiv>
          <SearchFile
            title={'我的文档'}
            onSearch={searchFile}
          ></SearchFile>

          <FileList
            files={fileList}
            editFile={openItem}
            deleteFile={deleteItem}
            saveFile={saveData}
          />

        </LeftDiv>
        <RightDiv>
          {
            activeFile &&
            <>
              <TabList
                files={openFiles}
                activeItem={activeId}
                unSaveItems={unSaveIds}
                clickItem={changeActive}
                closeItem={closeFile}
              />
              <SimpleMDE
                key={activeFile && activeFile.id}
                onChange={(value) => { changeFile(activeFile.id, value) }}
                value={activeFile.body}
                options={{
                  autofocus: true,
                  spellChecker: false,
                  minHeight: "445px"
                }}
              />
            </>
          }
          {
            !activeFile &&
            <div className="init-page">新建或者导入具体的文档</div>
          }
        </RightDiv>
      </div>
    </div >
  )
}

export default App
