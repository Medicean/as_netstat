# AntSword NetStat

> AntSword 查看网络连接状态插件

在目标主机「禁止了命令执行」或者「没有 netstat 命令」的时候，可通过该插件查看 Linux目标系统连接情况。

同时也支持解析通过其它方式获取到的 `/proc/net/tcp`、`/proc/net/udp` 文件内容

## 演示

### 选择 TCP4、UDP4 后, 点击「获取」

![netstat-01.png](https://i.loli.net/2019/01/29/5c5050a19a7cc.png)

### 手动输入通过其它方式获取到的 /proc/net/tcp 文件内容

![netstat-02.png](https://i.loli.net/2019/01/29/5c5050a1ea5f6.png)

## 安装

### 商店安装

进入 AntSword 插件中心，选择 NetStat，点击安装

### 手动安装

1. 获取源代码

	```
	git clone https://github.com/Medicean/as_netstat.git
	```
	
	或者
	
	点击 [这里](https://github.com/Medicean/as_netstat/archive/master.zip) 下载源代码，并解压。

2. 拷贝源代码至插件目录

    将插件目录拷贝至 `antSword/antData/plugins/` 目录下即安装成功

## 相关链接

* [AntSword 文档](http://doc.u0u.us)
* [dhtmlx 文档](http://docs.dhtmlx.com/)
