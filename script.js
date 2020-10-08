/**
 * 基于localstorage的存储,刷新页面后不会失去原来代码
 * linjie
 */
function saveCode()
{
    var code = window.editor.getValue();
    code = encode(code);
    try {
        localStorage.setItem("code", code);
    }
    catch(err) {
        console.log(`错误信息:${err}`);
        alert(`错误信息:${err}`)
        return;
    }
    alert(`保存成功`)
}

function encode(str) {
    return btoa(encodeURIComponent(str));
}

function decode(str) {
    return decodeURIComponent(atob(str));
}

// 格式化时间戳
function getFormatTime()
{
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    if (h >= 0 && h <= 9) h = '0' + h;
    if (m >= 0 && m <= 9) m = '0' + m;
    if (s >= 0 && s <= 9) s = '0' + s;
    return h.toString() + m.toString() + s.toString();
}



// Microsoft 的 Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.loli.net/ajax/libs/monaco-editor/0.9.0/min/vs' }});
require.config({
    'vs/nls': {
        availableLanguages: {
            '*': 'zh-cn'
        }
    }
});
require(['vs/editor/editor.main'], () => {
    // Dark Mode Theme 暗黑主题
    monaco.editor.defineTheme('vs-darker', {
        base: 'vs-dark',
        inherit: true,
    });
    // Initialize Editor 初始化
    var d = new Date();
    var t = d.toLocaleString();
    var c = localStorage.getItem("code");
    var str = c != null ? decode(c) : "# " + t;
    window.editor = monaco.editor.create(document.getElementById("editorContainer"), {
        theme: 'vs',
        fontSize: "16px",
	    mouseWheelZoom: true,
        model: monaco.editor.createModel(str, "python"),
        wordWrap: 'on',
        automaticLayout: true,
        fontFamily: '"Fira Code", "Noto Sans SC", monospace',
        scrollbar: {
            vertical: 'auto'
        }
    }); 
    
});

document.onkeydown = function(e) {
    if (e.ctrlKey && e.code == "KeyS") 
    {
        saveCode();
        e.preventDefault();
    }
}



// Skulpt配置
function outf(text) { 
    var mypre = document.getElementById("outputContainer"); 
    mypre.innerHTML = mypre.innerHTML + text; 
}


/**
 * 以下是在编译器中导入numpy包
 * 1、定义externalLibs
 * 2、构建builtinRead
 * 3、在runCode()中加入配置Sk.configure
 * 参考：https://jsbin.com/jokoyituhu/1/edit?html,js,console
 * @type {{"./numpy/__init__.js": string}}
 */
var externalLibs = {
  "./numpy/__init__.js": "https://cdn.jsdelivr.net/gh/ebertmi/skulpt_numpy@master/numpy/__init__.js"
};

function builtinRead(file) {
      console.log("Attempting file: " + Sk.ffi.remapToJs(file));

      if (externalLibs[file] !== undefined) {
        return Sk.misceval.promiseToSuspension(
          fetch(externalLibs[file]).then(
            function (resp){ return resp.text(); }
          ));
      }

      if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[file] === undefined) {
        throw "File not found: '" + file + "'";
      }

      return Sk.builtinFiles.files[file];
}

/**
 * 【运行】核心代码
 */
function runCode() {
    try {
        var prog = window.editor.getValue(); 
    } catch(err) {
        console.log(`错误信息:${err}`);
        return;
    }
    var mypre = document.getElementById("outputContainer"); 
    mypre.innerHTML = ''; 
    var myCanvas = document.getElementById("turtleCanvas"); 
    myCanvas.innerHTML = '';
    Sk.pre = "output";

    /**
     * 配置builtinRead
     */
    Sk.configure({
      read: builtinRead,
      output: outf,
      __future__: Sk.python3,
    });

    (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'turtleCanvas';
    var myPromise = Sk.misceval.asyncToPromise(function() {
        return Sk.importMainWithBody("<stdin>", false, prog, true);
    });
    myPromise.then(function(mod) {
        console.log('Yeah! There\'s nothing wrong! when ' + getFormatTime() + ' ¯\_(ツ)_/¯');
    },
        function(err) {
            var errlog = document.getElementById("outputContainer");
            var curMode = document.getElementsByTagName('meta')['theme'];
            // popInfo("运行出错了", "= = 看看错误信息吧", "infoErr", "fa fa-bug");
            if (curMode.content == "dark") {
                errlog.innerHTML = mypre.innerHTML + "<div class=\"errorLog\">" + err.toString() + "</div>";
            } else {
                errlog.innerHTML = mypre.innerHTML + "<div class=\"errorLog light\">" + err.toString() + "</div>";
            }
    });

}

