//传入参数分别为：待读取的sass文件列表，输出JSON文件的目标地址（含JSON文件名）
//可读取以下两种格式的sass样式文件顶部注释并输出为JSON文件

/********** 格式1 START *********/

/**
 * FileTitle 此文件的中文介绍
 * 
 * --- Category1 ---
 * #ToolName 此方法的中文介绍（可选）
 * #ToolName 此方法的中文介绍（可选）
 * 
 * --- Category2 ---
 * #ToolName 此方法的中文介绍（可选）
 * #ToolName 此方法的中文介绍（可选）
 * 
 */ 

/********** 格式1 END ***********/

/********** 格式2 START *********/

/**
 * FileTitle 此文件的中文介绍
 * 
 * #ToolName 此方法的中文介绍（可选）
 * #ToolName 此方法的中文介绍（可选）
 * 
 */ 

/********** 格式2 END ***********/

function readQmuiStyleComments(rawFiles, outputPath) {
	if (!rawFiles || !outputPath) {
		return false;
	}

	var sassData = [];

	var fs = require('fs');

	for (var k = 0; k < rawFiles.length; k++) {
		var currentFileData = {};

		var targetFile = rawFiles[k];
		currentFileData.title = targetFile.split('/').pop();	//文件名
		var rawStr = fs.readFileSync(targetFile, 'utf8');
		var commentsStr = rawStr.match(/\/\*+[\s\S]+?\*\//g);

		commentsStr = commentsStr[0];	//抽取出开头/* */及其内部的内容

		var introRegExp = new RegExp(currentFileData.title + '.*', 'i');	
		var introLine = commentsStr.match(introRegExp)[0];		//抽取出类似"_effect.scss 辅助编写样式效果的工具方法"这一行的这一段信息
		currentFileData.intro = trimString(introLine.split(currentFileData.title)[1]);		//抽取出类似"辅助编写样式效果的工具方法"这句中文介绍，去除首尾空格

		currentFileData.items = [];

		var commentsStrFiltered = commentsStr.replace(/(\*)|(\/)|(\n)/g, '');	//去除星号*、斜杠、换行符

		var sections = commentsStrFiltered.match(/-{2,}[\s\S]*?-{2,}[^-]+/g);	//将_compatible.scss里类似"--- layout ---"的这种父类分拆到数组里，并且去除星号*、斜杠\、换行符
		//_compatible.scss里这种有"--- xxx ---"父级分类
		if (sections) {
			for (var i = 0; i < sections.length; i++) {
				var section = sections[i];
				var item = {};
				item.title = trimString(section.match(/[^-]+/)[0]);
				item.contents = section.match(/\#+[^\#]+/g);
				for (var j = 0; j < item.contents.length; j++) {
					item.contents[j] = trimString(item.contents[j].replace('#', ''));
				}
				currentFileData.items.push(item);
			}
		}
		else {
			var item = {};
			item.title = "nil";
			item.contents = commentsStrFiltered.match(/\#+[^\#]+/g);
			for (var j = 0; j < item.contents.length; j++) {
				item.contents[j] = trimString(item.contents[j].replace('#', ''));
			}
			currentFileData.items.push(item);
		}

		sassData.push(currentFileData);
	}

	//因为有可能目标目录不存在，因此在这里尝试创建目标目录
	var path = require('path');
	var outputDir = path.dirname(outputPath);
	fs.mkdir(outputDir, function(errMsg){});
	//写入文件
	fs.writeFileSync(outputPath, 'var comments = ' + JSON.stringify(sassData), 'utf8');
}

//去除字符串首尾空格
function trimString(str) {
	return str.replace(/(^\s*)|(\s*$)/g, '');
}

module.exports = readQmuiStyleComments;