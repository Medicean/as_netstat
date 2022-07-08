'use strict'

const WIN = require("ui/window");
const Tabbar = require('ui/tabbar');
const LANG = require('./language/');
const LANG_T = antSword['language']['toastr'];

class Plugin {
  constructor(opt) {
    let self = this;
    self.opt = opt;
    self.core = new antSword['core'][opt['type']](opt);
    self.isWindows = false;
    self.WinSupportCore = ['aspx'];
    self.coreType = opt['type'];

    let cache = new antSword['CacheManager'](self.opt["_id"]);
    const cache_info = cache.get('info');
    if (cache_info) {
      if (cache_info[0] === "/") {
        self.isWindows = false;
      } else {
        self.isWindows = true;
        if (!self.WinSupportCore.includes(self.coreType)) {
          toastr.error(LANG['msg']['winnotsupport'], LANG_T['error']);
          return
        }
      }
      self.initUI();
    } else {
      self.core.request(
        self.core.base.info()
      ).then((ret) => {
        if (ret['text'][0] === "/") {
          self.isWindows = false;
        } else {
          self.isWindows = true;
          if (!self.WinSupportCore.includes(self.coreType)) {
            toastr.error(LANG['msg']['winnotsupport'], LANG_T['error']);
            return
          }
        };
        self.initUI();
      }).catch((err) => {
        toastr.error(err, LANG_T['error']);
      });
    }
  }

  initUI() {
    let self = this;
    self.tabbar = new Tabbar();
    self.tabbar.cell.setText(`<i class="fa fa-signal"></i> ${LANG['title']}-${self.opt['ip']}`);
    self.grid = null;
    self.toolbar = null;

    self.createToolBar();
    self.createGrid();
    self.bindToolbarClickHandler();
  }

  createToolBar() {
    let self = this;
    let toolbar = self.tabbar.cell.attachToolbar();
    toolbar.loadStruct([
      { id: 'label', type: 'text', text: LANG['main']['toolbar']['label'], },
      { id: 'tcp4', type: 'buttonTwoState', text: 'TCP4', title: LANG['main']['toolbar']['tcp4'], pressed: true, },
      { id: 'udp4', type: 'buttonTwoState', text: 'UDP4', title: LANG['main']['toolbar']['udp4'], pressed: false, },
      { type: 'separator' },
      { id: 'start', type: 'button', text: LANG['main']['toolbar']['start'], icon: 'play' },
      { type: 'separator' },
      { id: 'local', type: 'button', text: LANG['main']['toolbar']['manual'], icon: 'edit' },
      { type: 'separator' },
      { id: 'clear', type: 'button', text: LANG['main']['toolbar']['clear'], icon: 'remove' },
    ]);
    self.toolbar = toolbar;
  }

  createGrid() {
    let self = this;
    let grid = self.tabbar.cell.attachGrid();
    grid.setHeader(`Proto,Local Address,Remote Address,State`);
    grid.setColumnIds("proto,laddr,raddr,state");
    grid.setColTypes("ro,ro,ro,ro");
    grid.setColSorting('str,str,str,str');
    grid.setInitWidths("150,300,300,*");
    grid.setColAlign("left,left,left,center");
    grid.enableMultiselect(true);
    grid.init();
    self.grid = grid;
  }

  bindToolbarClickHandler() {
    let self = this;
    self.toolbar.attachEvent('onClick', (id) => {
      switch (id) {
        case 'start':
          if (self.isWindows == false) {
            let inetfiles = [];
            ['tcp4', 'udp4'].forEach((item) => {
              if (self.toolbar.getItemState(item) == true) {
                inetfiles.push({
                  inet: item,
                  path: INET_FILE_MAPPING[item]
                });
              };
            });
            if (inetfiles.length == 0) {
              toastr.warning(LANG['msg']['emptyselect'], LANG_T['warning']);
              return
            }

            // 清空 grid
            self.grid.clearAll();

            inetfiles.map((p) => {
              self.core.request(
                self.core.filemanager.read_file({
                  path: p.path,
                })
              ).then((res) => {
                let data = res['text'];
                self.gridParse(data, p.inet, true);
                toastr.success(LANG['success'], LANG_T['success']);
              }).catch((err) => {
                toastr.error(err, LANG_T['error']);
              });
            });
          } else {
            // windows 下
            self.grid.clearAll();
            ['tcp4', 'udp4'].forEach((inettype) => {
              if (self.toolbar.getItemState(inettype) == true) {
                self.core.request({
                  _: self.getWinPayload(inettype)
                }).then((res) => {
                  let data = res['text'];
                  // 清空 grid
                  let results = data.split('\n');
                  results.forEach((result, i) => {
                    let line = result.split("\t");
                    if (line.length < 4) {
                      return
                    }
                    let connitem = {
                      proto: (line[0].toUpperCase()) || inettype,
                      laddr: line[1] || '',
                      raddr: line[2] || '',
                      state: (line[3].toUpperCase()) || '-',
                    };
                    let rowId = `${inettype}-${i}`;
                    self.grid.addRow(rowId, "");
                    self.GridsetRowData(rowId, connitem);
                    if (connitem.state == "LISTENING" || (inettype.startsWith('udp') && connitem.laddr.startsWith("0.0.0.0"))) {
                      self.grid.setRowColor(rowId, "#ADF1B9");
                    }
                  });
                }).catch((err) => {
                  toastr.error(err, LANG_T['error']);
                });
              }
            });
          }
          break;
        case 'local':
          self.createLocalEditor();
          break;
        case 'clear':
          self.grid.clearAll();
          break;
        default:
          break;
      }
    });
  }

  getWinPayload(inettype) {
    let self = this;
    let codes = {
      aspx_tcp4: `
      try{
        var properties = System.Net.NetworkInformation.IPGlobalProperties.GetIPGlobalProperties();
        var i;
        var listeners = properties.GetActiveTcpListeners();
        for(i in listeners){
          var t = listeners[i];
          if(t.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork){
            Response.Write("TCP\\t"+t.ToString()+"\\t0.0.0.0:0\\tListening\\n");
          }
        };
        var connections = properties.GetActiveTcpConnections();
        for(i in connections){
          var t = connections[i];
          if(t.LocalEndPoint.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork){
            Response.Write("TCP\\t"+t.LocalEndPoint+"\\t"+t.RemoteEndPoint+"\\t"+t.State+"\\n");
          }
        };
      }catch(e){
        Response.Write(e);
      };
      `.replace(/\n\s+/g, ''),
      aspx_udp4: `
      try{
        var properties = System.Net.NetworkInformation.IPGlobalProperties.GetIPGlobalProperties();
        var i;
        var listeners = properties.GetActiveUdpListeners();
        for(i in listeners){
          var t = listeners[i];
          if(t.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork){
            Response.Write("UDP\\t"+t.ToString()+"\\t0.0.0.0:0\\t-\\n");
          }
        };
      }catch(e){
        Response.Write(e);
      };
      `.replace(/\n\s+/g, ''),
    }
    return codes[`${self.coreType}_${inettype}`];
  }

  createLocalEditor() {
    let self = this;
    let inet_type = "tcp4";

    let _win = new WIN({
      title: LANG['manual']['title'](INET_FILE_MAPPING[inet_type]),
    });

    let toolbar = _win.win.attachToolbar();
    toolbar.loadStruct([
      { id: 'inet_type_label', type: 'text', text: LANG['manual']['toolbar']['label'] },
      {
        id: 'inet_type',
        type: 'buttonSelect',
        mode: 'select',
        selected: inet_type,
        width: 100,
        options: [
          { id: 'tcp4', type: 'button', icon: 'hashtag', text: 'TCP4' },
          { id: 'udp4', type: 'button', icon: 'hashtag', text: 'UDP4' },
        ]
      },
      { id: 'save', type: 'button', icon: 'check', text: LANG['manual']['toolbar']['save'], }
    ]);

    toolbar.attachEvent('onClick', (id) => {
      switch (id) {
        case 'tcp4':
          _win.win.setText(LANG['manual']['title'](INET_FILE_MAPPING[inet_type]));
          inet_type = "tcp4";
          break;
        case 'udp4':
          _win.win.setText(LANG['manual']['title'](INET_FILE_MAPPING[inet_type]));
          inet_type = "udp4";
          break;
        case 'save':
          // 保存
          let data = editor.session.getValue();
          if (!data) {
            toastr.warning(LANG['msg']['empty'], LANG_T["warning"]);
            return
          }
          self.grid.clearAll();
          self.gridParse(data, inet_type, false);
          toastr.success(LANG['msg']['parse_finished'], LANG_T['success']);
          break;
      }
    });

    // 创建编辑器
    let editor;
    editor = ace.edit(_win.win.cell.lastChild);
    editor.$blockScrolling = Infinity;
    editor.setTheme('ace/theme/tomorrow');
    editor.session.setMode('ace/mode/text');
    editor.session.setUseWrapMode(true);
    editor.session.setWrapLimitRange(null, null);
    editor.setOptions({
      fontSize: '14px',
      enableBasicAutocompletion: true,
      enableSnippets: true,
      enableLiveAutocompletion: true
    });
    // 编辑器快捷键
    editor.commands.addCommand({
      name: 'save',
      bindKey: {
        win: 'Ctrl-S',
        mac: 'Command-S'
      },
      exec: () => {
        toolbar.callEvent('onClick', ['save']);
      }
    });
    // 定时刷新
    const inter = setInterval(editor.resize.bind(editor), 200);
    _win.win.attachEvent('onClose', () => {
      clearInterval(inter);
      return true;
    });
  }

  gridParse(data, data_type = "tcp4", append = false) {
    let self = this;
    let result = parseNetFile(data);
    result.map((item, i) => {
      if (!item) { return };
      let connitem = {};
      switch (data_type) {
        case 'tcp4':
          connitem = {
            laddr: Inet4Addr(item.laddr),
            raddr: Inet4Addr(item.raddr),
            status: TCP_STATUS_MAPPING[item.status.toUpperCase()] || item.status,
          }
          break;
        case 'udp4':
          connitem = {
            laddr: Inet4Addr(item.laddr),
            raddr: Inet4Addr(item.raddr),
            status: "-",
          }
          break;
        default:
          break;
      }
      let rowId = `${data_type}-${i}`;
      self.grid.addRow(rowId, "");
      self.GridsetRowData(rowId, {
        "proto": data_type,
        "laddr": connitem.laddr,
        "raddr": connitem.raddr,
        "state": connitem.status,
      });
      if (connitem.status == "LISTEN" || (data_type.startsWith("udp") && connitem.laddr.startsWith("0.0.0.0:"))) {
        self.grid.setRowColor(rowId, "#ADF1B9");
      }
    });
  }

  GridsetRowData( /*string*/ rowId, /*json*/ rowJson) {
    let self = this;
    var colsNum = self.grid.getColumnsNum();
    for (var index = 0; index < colsNum; index++) {
      var colId = self.grid.getColumnId(index);
      if (colId && rowJson.hasOwnProperty(colId)) {
        self.grid.cells(rowId, index).setValue(rowJson[colId]);
      }
    }
  };
}

const INET_FILE_MAPPING = {
  "tcp4": "/proc/net/tcp",
  "tcp6": "/proc/net/tcp6",
  "udp4": "/proc/net/udp",
  "udp6": "/proc/net/udp6",
}

const TCP_STATUS_MAPPING = {
  "01": "ESTABLISHED",
  "02": "SYN_SENT",
  "03": "SYN_RECV",
  "04": "FIN_WAIT1",
  "05": "FIN_WAIT2",
  "06": "TIME_WAIT",
  "07": "CLOSE",
  "08": "CLOSE_WAIT",
  "09": "LAST_ACK",
  "0A": "LISTEN",
  "0B": "CLOSING",
}

function Inet4Addr(addr) {
  let l = addr.split(":");
  let ip = Buffer.from(l[0], "hex").reverse().join(".").toString();
  let port = parseInt(l[1], 16);
  return ip + ":" + port;
}

function parseNetFile(data) {
  let ret = [];
  data = data.trim()
  let datas = data.split("\n")
  if (datas[0].indexOf('local_address') != -1) {
    datas.shift();
  }
  datas.forEach((line) => {
    let l = line.trim().split(/\s+/);
    if (l.length < 10) {
      return
    }
    var laddr = l[1];
    var raddr = l[2];
    var status = l[3];
    var inode = l[9];
    ret.push({
      laddr: laddr,
      raddr: raddr,
      status: status,
      inode: inode,
    });
  });
  return ret;
}

module.exports = Plugin;