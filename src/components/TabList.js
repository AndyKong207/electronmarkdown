import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import classNames from 'classnames'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'

// 自定义 ul 标签
let TabUl = styled.ul.attrs({
  className: 'nav nav-pills'
})`
  border-bottom: 1px solid #fff;
  li a{
    color: #fff;
    border-radius: 0px!important;
  }
  li a.active{
    background-color: #3e403f!important;
  }
  .nav-link.unSaveMark .rounded-circle{
    width: 11px;
    height: 11px;
    display: inline-block;
    background-color:#b80233; 
  }
  .nav-link.unSaveMark .icon-close{
    display: none;
  }
  .nav-link.unSaveMark:hover .icon-close{
    display: inline-block;
  }
  .nav-link.unSaveMark:hover .rounded-circle{
    display: none;
  }
`

const TabList = ({ files, activeItem, unSaveItems, clickItem, closeItem }) => {
  return (
    <TabUl>
      {
        files.map(file => {
          // 定义变量控制未保存状态
          let unSaveMark = unSaveItems.includes(file.id)

          // 组合类名
          let finalClass = classNames({
            "nav-link": true,
            "active": activeItem === file.id,
            "unSaveMark": unSaveMark
          })
          return (
            <li className="nav-item" key={file.id}>
              <a
                href="#"
                className={finalClass}
                onClick={(e) => { e.preventDefault(); clickItem(file.id) }}
              >
                {file.title}
                <span
                  className="ml-2 icon-close"
                  onClick={(e) => { e.stopPropagation(); closeItem(file.id) }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </span>
                {unSaveMark && <span className="ml-2 rounded-circle"></span>}
              </a>
            </li>
          )
        })
      }
    </TabUl>
  )
}

TabList.propTypes = {
  files: PropTypes.array,
  activeItem: PropTypes.string,
  unSaveItems: PropTypes.array,
  clickItem: PropTypes.func,
  closeItem: PropTypes.func
}

TabList.defaultProps = {
  unSaveItems: []
}

export default TabList
