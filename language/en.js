module.exports = {
  title: "NetStat",
  success: "Ret Success",
  error: "Ret Error",
  main: {
    toolbar: {
      label: 'Net Config',
      tcp4: 'Get tcp4 connection information',
      udp4: 'Get udp4 connection information',
      start: 'Get',
      manual: 'Manual Input',
      clear: 'Clear',
    },
  },
  manual: {
    title: (path)=> antSword.noxss(`Paste the content in ${path}`),
    toolbar: {
      label: 'INET Type',
      save: 'Parse'
    },
  },
  msg: {
    onlylinux: "Only support Linux Shell",
    emptyselect: "Choose at least one type",
    empty: "Please complete the form",
    parse_finished: "Parsed",
  },
}