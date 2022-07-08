module.exports = {
  title: "网络连接",
  success: "获取成功",
  error: "获取失败",
  main: {
    toolbar: {
      label: '获取配置',
      tcp4: '获取 tcp4 连接信息',
      udp4: '获取 udp4 连接信息',
      start: '获取',
      manual: '手动输入(Linux)',
      clear: '清空',
    },
  },
  manual: {
    title: (path) => antSword.noxss(`请粘贴 ${path} 内容`),
    toolbar: {
      label: '解析类型',
      save: '解析'
    },
  },
  msg: {
    winnotsupport: "Windows 下暂不支持该类型",
    onlylinux: "仅支持 Linux 操作系统的Shell",
    emptyselect: "至少选择一种类型",
    empty: "请填写完整",
    parse_finished: "解析完毕",
  },
}