import React, { Fragment, useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faSearch } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyHandler from '../hooks/useKeyHandler'
import useIpcRenderer from '../hooks/useIpcRenderer'

// 自定义搜索区域的 div 
let SearchDiv = styled.div.attrs({
  className: 'd-flex align-items-center justify-content-between'
})`
  border-bottom: 1px solid #fff;
  span{
    color:#fff;
    padding: 0 10px;
    font: normal 16px/40px '微软雅黑'
  }
  input{
    border: none;
    border-radius: 4px;
    margin-left: 10px;
  }
`

const SearchFile = ({ title, onSearch }) => {
  const [searchActive, setSearchActive] = useState(false)
  const [value, setValue] = useState('')
  const enterPressed = useKeyHandler(13)
  const escPressed = useKeyHandler(27)

  const oInput = useRef(null)

  const closeSearch = () => {
    setSearchActive(false)
    setValue('')

    // 当我们关闭搜索功能的时候，可以给它提供一个空字符，这样就没有满足条件的搜索
    // 结果，此时就能将原来列表数据重新展示出来
    onSearch('')
  }

  useEffect(() => {
    if (enterPressed && searchActive) {
      onSearch(value)
    }

    if (escPressed && searchActive) {
      closeSearch()
    }
  })

  useEffect(() => {
    if (searchActive) {
      oInput.current.focus()
    }
  }, [searchActive])

  useIpcRenderer({
    'execute-search-file': () => {
      setSearchActive(true)
    }
  })

  return (
    <Fragment>
      {
        !searchActive &&
        <>
          <SearchDiv>
            <span>{title}</span>
            <span onClick={() => { setSearchActive(true) }}>
              <FontAwesomeIcon icon={faSearch}></FontAwesomeIcon>
            </span>
          </SearchDiv>
        </>
      }
      {
        searchActive &&
        <>
          <SearchDiv>
            <input
              value={value}
              ref={oInput}
              onChange={(e) => { setValue(e.target.value) }}
            />
            <span onClick={closeSearch}>
              <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
            </span>
          </SearchDiv>
        </>
      }
    </Fragment>
  )
}

SearchFile.propTypes = {
  title: PropTypes.string,
  onSearch: PropTypes.func.isRequired
}

SearchFile.defaultProps = {
  title: '文档列表'
}

export default SearchFile

