const PagePattern 			= /(.*\/.*\/(.*)\/[A-Z][A-Z])?(\s+)?(\d{2})([A-H]|[ ])\d{2}(\d{4})(.*)-(\d{2}\/\d{2})(.*[^\s+])(\s+)?(\d\.\d{2})(\d+)/;
const TextFileNamePattern	= /textfile([A-Z0-9]{2}).txt/;
const ImportFileNamePattern	= /AdListwIDPDFImport_Export_\d{8}_\d{6}\.csv/;
const CSVfileHeaderPattern	= /"Customer ID","Company Name","Art File Name","Description"/;
const CSVfileRowPattern		= /"(.*?)","(.*?)","(.*?)","(.*?)"/;
const NameFieldPattern		= /(\d{4}-\d{4}[A-Z]{2})(-*)(\w*)/;

const custID				= 1;
const compName				= 2;
const artFileName			= 3;
const mrktPubType			= 4;

var blankObj				= {
									"header":"\r\rBlank entries found\r===========================\r",
									"count":0,
									"entries":
									{

									}
							  };

function filterTextFileNames(thefile)
{
    if (thefile instanceof Folder)
    {
        return false;
    }

    if( TextFileNamePattern.exec(thefile.name) )
    {
        return true;
    }
}

function getFileList(folderPath)
{
	var fileListArray = [];

	var theFolder = new Folder(folderPath);

	if(theFolder.exists)
	{
		fileListArray = theFolder.getFiles();
	}

	return fileListArray;
}

function readInDataFile(filename)
{
    var data = null
    var file = new File(filename);

    if(file.exists)
    {
        try
        {   
            file.open("r");
            data = file.read();
            file.close();
        }
        catch(Error)
        {
            alert("File read error\r" + Error);
        }
    }

    /*
    else
    {
        alert("No data file found for this path: "
            + "\r" + filename);
    }
    */

    return data;
}

function parseExportData(theFilePath)
{
	var cvsDataObj 		= null;
	var fileData 		= null;
	var dataFields		= null;

	var theCSVfile 		= '';
	var theFiles 		= loResFolder.getFiles();

	var found			= false;
	var fixedName		= "";
	var adNumber		= "";

	// Search through low res book folder to see
	// if we can find the CSV expor file
	for(var f = 0; f < theFiles.length; f++)
	{
		if( ImportFileNamePattern.exec( theFiles[f].name ) )
		{
			found = true;
			theCSVfile = theFiles[f]
			break;
		}
	}

	// If found, process the file.
	if(found)
	{
		fileData = readInDataFile(theCSVfile.fsName);

		if(fileData)
		{
			var fileDataArr = fileData.split("\n");

			if( CSVfileHeaderPattern.exec( fileDataArr[0] ) )
			{
				cvsDataObj = {};

				for(var d = 1; d < fileDataArr.length; d++)
				{
					dataFields = CSVfileRowPattern.exec( fileDataArr[d] )

					if(dataFields)
					{
						// We just need the ad number to use as the obj key
						// ( i.e. change 0884-0323CH-SOE into 0884 )
						adNumber = dataFields[ artFileName ].split("-")[0];

						if( !( cvsDataObj[ adNumber ] ) )
						{
							// Strip out the pub type from the end of field
							// ( i.e. change 0884-0323CH-SOE into 0884-0323CH )
							fixedName = NameFieldPattern.exec( dataFields[ artFileName ] )[1];

							cvsDataObj[ adNumber ] = fixedName + ".pdf";
						}
						else
						{
							if( dataFields[ artFileName ] === "" )
							{
								blankObj[ "count" ] += 1;
								blankObj[ "entries" ][ "" + dataFields[ custID ] ] = dataFields[ compName ];

								/*
								alert("The entries\r" 
									+ "Number:" + dataFields[1] + "\r"
									+ "Name:"   + dataFields[2])
								*/

							}							
							else
							{	
								alert("" + cvsDataObj[ adNumber ] + " is a duplicate");
							}
						}
					}
				}
			}
		}
	}
	else
	{
		alert( "The CSV Export file was not found" + "\r"
			 + "Before continuing, make sure the export "
			+  "file is within the proper \"Lo Res Proofs\" folder "
			+  "for this particular market and issue");
	}

	return(cvsDataObj);
}

function copyFilesToLocalFldr(theLocalFolder,theFileArray, theCounterObj, theCounterKey, win, theFilesObj, adType)
{
	var theLogStrObj	= {};
	var copyTypeStr 	= adType["str"];

	// var theFilesObj		= {};

	theLogStrObj["bookStr"] 	= "";
	theLogStrObj["csvFileName"] = "No file found"
	
	if(theFileArray != null)
	{
		for(d = 0; d < theFileArray.length; d++)
		{
			var tempFile = new File(theLocalFolder.fsName + "/" + theFileArray[d].name);

			if(tempFile.exists)
			{
				theLogStrObj["bookStr"] += theFileArray[d].name + ": Duplicate file" +  "\r";
				continue;
			}

			// We found the export file.
			if( ImportFileNamePattern.exec(theFileArray[d].name) )
			{
				theFileArray[d].copy(theLocalFolder.fsName + "/" + theFileArray[d].name);
				theLogStrObj["csvFileName"] = theFileArray[d].name;

				/*cvsDataObj = parseExportData( theFileArray[d].fsName );*/

				win.proBar.value = d;
				continue;
			}

			theFilesObj[ theFileArray[d].name.split("-")[0] ] = theFileArray[d].name;
			
			theFileArray[d].copy(theLocalFolder.fsName + "/" + theFileArray[d].name);
			theLogStrObj["bookStr"] += theFileArray[d].name + "\r";

			theCounterObj[theCounterKey]++;
			
			adType["str"] = copyTypeStr + " " + d + " of " + theFileArray.length + " files";
			win.fileCopyText.notify("onChange");

			win.proBar.value = d;
		}
	}

	return theLogStrObj;
}

function findDiscrepancies(theFilesObj, cvsDataObj)
{
	var theLogStrObj = {};

	theLogStrObj["csvFile"]   = "";

	theLogStrObj["csvFile"]  +=	"Files in low res folders not listed in CSV\r";
	theLogStrObj["csvFile"]  +=	"------------------------------------------\r";

	theLogStrObj["misNamed"]  = "\r";

	theLogStrObj["misNamed"] += "The files listed below are either named\r";
	theLogStrObj["misNamed"] += "incorrectly within the CSV file, or reside\r"
	theLogStrObj["misNamed"] += "within the wrong directory\r";
	theLogStrObj["misNamed"] += "------------------------------------------\r";

	if(cvsDataObj)
	{
		var lowResCnt	= 0;
		var misNamedCnt	= 0;

		for(var key in theFilesObj)
		{
			if( !(cvsDataObj[key]) )
			{
				if( theLogStrObj["csvFile"] )
					theLogStrObj["csvFile"] += theFilesObj[key] + "\r";
				else
					theLogStrObj["csvFile"] = theFilesObj[key] + "\r";

				lowResCnt++;
			}
			else
			{
				if( cvsDataObj[key] != theFilesObj[key] )
				{
					theLogStrObj["misNamed"] += cvsDataObj[key] + "\r";
					misNamedCnt++;
				}
			}
		}

		if(!lowResCnt)
			theLogStrObj["csvFile"] += "None\r";

		if(!misNamedCnt)
			theLogStrObj["misNamed"] += "None\r";

		// alert("The misname cnt: " + misNamedCnt);
	}

	theLogStrObj["csvFile"] += "\r";

	theLogStrObj["csvFile"] +=	"Files listed in CSV file not found in low res folders\r";
	theLogStrObj["csvFile"] +=	"-----------------------------------------------------\r";

	if(theFilesObj)
	{
		var csvCnt = 0;

		for(var key in cvsDataObj)
		{
			if( !(theFilesObj[key]) )
			{
				if( theLogStrObj["csvFile"] )
					theLogStrObj["csvFile"] += cvsDataObj[key] + "\r";
				else
					theLogStrObj["csvFile"] = cvsDataObj[key] + "\r";

				csvCnt++
			}
		}

		if(!csvCnt)
			theLogStrObj["csvFile"] += "None\r";
	}

	theLogStrObj["csvFile"] 	+= "\r";
	theLogStrObj["misNamed"]	+= "\r";

	return(theLogStrObj);
}

function writeLogFile(theLogObj, counterObj, mrkFolderName)
{
	var theLogFile = new File("~/Desktop/LoRes MagMan Uploads/" + mrkFolderName + "_LoRes_Report.txt");

	if(theLogFile)
	{
		theLogFile.open('w');
		theLogFile.lineFeed = "Windows";

		for(var key in theLogObj)
		{
			if( theLogObj[key] != undefined )
				theLogFile.write( theLogObj[key] );
		}

		/*
		for(var key in blankObj)
		{
			if( blankObj[key] != undefined )
				theLogFile.write( blankObj[key] + ":" + "");
		}
		*/

		if( blankObj["count"] )
		{
			theLogFile.write(blankObj["header"]);
			theLogFile.write("Total number of blank entries: " + blankObj["count"] + "\r");

			for(var key in blankObj["entries"])
			{
				theLogFile.write(key + ":" + blankObj["entries"][key] + "\r");
			}

			theLogFile.write("\r");
		}


		theLogFile.write("Total number of files copied: " + (counterObj["book"] + counterObj["dal"] + counterObj["insert"]) ); 

		theLogFile.close();
	}
	else
	{
		alert("Sorry - No log file");
	}
}

var selectedFolder = Folder.selectDialog("Select folder with form text files");

if(selectedFolder)
{
	var 	basePath = selectedFolder.parent.parent.fsName;
	var baseMrktPath = selectedFolder.parent.parent.parent.fsName;
	var baseMrktName = selectedFolder.parent.parent.name;

	/*
	alert("basePath:\r" + basePath);
	alert("baseMrktPath:\r" + baseMrktPath);
	alert("baseMrktName:\r" + baseMrktName);
	*/

	var theFiles = selectedFolder.getFiles(filterTextFileNames);

	var theLogObj 	= {};
	var counterObj 	= {};
	var cvsDataObj	= {};

	var adType		= {};
	
	adType["str"] = "Book files";

																   // X1, Y1, X2, Y2
	var win = new Window( "palette", "Copying low-resolution files", [100,220,500,280] );

	win.proBar 			= win.add( "progressbar", [12,12,388,24], 0, 10 );
	win.fileCopyText	= win.add( "edittext",    [12,30,388,50], adType["str"] );

	win.fileCopyText.onChange = function()
    {
        this.text = adType["str"];
        this.graphics.drawOSControl();
    }

	if(theFiles)
	{
		theFiles[0].open('r');

		var theData	= theFiles[0].read();
		var parsed	= PagePattern.exec(theData);
		var city	= parsed[7];

		var tempObj = {};

		var movedFilesObj = {};

		if(parsed)
		{
			theFiles[0].close;

			theLogObj["hdr"]  = "Collecting files for the " + selectedFolder.parent.name + " market\r";
			theLogObj["hdr"] += "==========================================\r\r";

			counterObj["book"]		= 0;
			counterObj["dal"] 		= 0;
			counterObj["insert"] 	= 0;

			win.show();

			theDateName = parsed[8].split("/")[0] + parsed[8].split("/")[1] + parsed[7];

			var loResFldrName = selectedFolder.parent.parent.name.split("-")[1];
			var loResPath = '';

			if(loResFldrName == 'SOE' || loResFldrName == 'SOFH' || loResFldrName == 'HMSH' || loResFldrName == 'HPG')
				loResPath = basePath + "/" + city + "-Proofs/Lo Res Proofs/" + theDateName + " " + loResFldrName + " Proof Files/";

			if(loResFldrName == 'SOCT')
			{
				loResFldrName = 'APG'
				loResPath = basePath + "/" + city + "-Proofs/Lo Res Proofs/" + theDateName + " " + loResFldrName + " Proof Files/";
			}

			var loResFolder = new Folder(loResPath);

			if(loResFolder.exists)
			{
				cvsDataObj = parseExportData(loResFolder);

				if(cvsDataObj)
				{
					var localLoResFldr = new Folder("~/Desktop/LoRes MagMan Uploads/" + loResFolder.name);

					if(!localLoResFldr.exists)
						localLoResFldr.create();

					var loResFiles = loResFolder.getFiles();

					win.proBar.maxvalue = loResFiles.length - 1;

					var logStrObj = copyFilesToLocalFldr(localLoResFldr,loResFiles, counterObj, "book", win, movedFilesObj, adType);

					theLogObj["book"]  = "The CSV export file\r----------------\r" + logStrObj["csvFileName"] + "\r\r"

					theLogObj["book"] += "The book files\r";
					theLogObj["book"] += "--------------\r";
					theLogObj["book"] += logStrObj["bookStr"];
					theLogObj["book"] += "--------\r" + "Total Book files: " + counterObj["book"] + "\r\r";

					//alert("Book files are done copying");

					// For DT and CH SOE books, plus the TC HPG books, we need to copy over the ancillary files as well
					if( (selectedFolder.parent.parent.name == 'DT-SOE') || 
						(selectedFolder.parent.parent.name == 'CH-SOE') ||
						(selectedFolder.parent.parent.name == 'TC-HPG') ) 
					{
						
						var theDALFilesPath 	= "";
						var theInsertFilesPath 	= "";

						if( (selectedFolder.parent.parent.name == 'DT-SOE') || (selectedFolder.parent.parent.name == 'CH-SOE') )
						{
							theDALFilesPath 	= selectedFolder.parent.parent.parent.fsName + "/" + city + "-SOE_DAL/" 	+ city + "-Proofs/Lo Res Proofs/" + theDateName + " DAL Proof Files";
							theInsertFilesPath	= selectedFolder.parent.parent.parent.fsName + "/" + city + "-SOE_Inserts/" + city + "-Proofs/Lo Res Proofs/" + theDateName + " Insert Proof Files";
						}

						if( (selectedFolder.parent.parent.name == 'TC-HPG') )
						{
							theDALFilesPath 	= selectedFolder.parent.parent.parent.fsName + "/" + city + "-HPG_DAL/" 	+ city + "-Proofs/Lo Res Proofs/" + theDateName + " DAL Proof Files";
							theInsertFilesPath	= selectedFolder.parent.parent.parent.fsName + "/" + city + "-HPG_Inserts/" + city + "-Proofs/Lo Res Proofs/" + theDateName + " Insert Proof Files";
						}
						
						var theDALFiles 	= getFileList(theDALFilesPath);
						var theInsrtFiles 	= getFileList(theInsertFilesPath);

						var copiedFilesList = localLoResFldr.getFiles();

						adType["str"] = "DAL files";
						win.fileCopyText.notify("onChange");

						win.proBar.maxvalue = theDALFiles.length - 1;
						win.proBar.value = 0;

						theLogObj["dal"]  = "\rThe DAL files\r";
						theLogObj["dal"] += "-------------\r";
						theLogObj["dal"] += copyFilesToLocalFldr( localLoResFldr, theDALFiles, counterObj, "dal", win, movedFilesObj, adType )["bookStr"];
						theLogObj["dal"] += "--------\r" + "Total DAL files: " + counterObj["dal"] + "\r";
						theLogObj["dal"] += "\r";

						//alert("DAL files are done copying");

						adType["str"] = "Insert files";
						win.fileCopyText.notify("onChange");

						win.proBar.maxvalue = theInsrtFiles.length - 1;
						win.proBar.value 	= 0;

						theLogObj["insert"]  = "\rThe Insert files\r";
						theLogObj["insert"] += "----------------\r";
						theLogObj["insert"] += copyFilesToLocalFldr( localLoResFldr, theInsrtFiles, counterObj, "insert", win, movedFilesObj, adType )["bookStr"];
						theLogObj["insert"] += "--------\r" + "Total Insert files: " + counterObj["insert"] + "\r";
						theLogObj["insert"] += "\r";

						//alert("Insert files are done copying");
					}

					tempObj = findDiscrepancies(movedFilesObj, cvsDataObj);
					
					theLogObj["csvFile"]	= tempObj["csvFile"];
					theLogObj["misNamed"]	= tempObj["misNamed"];

					writeLogFile(theLogObj,counterObj, baseMrktName);
				}
			}
			else
			{
				alert("Sorry! Couldn't find Folder for low res files\r" + loResPath);
			}

			win.close();
		}
		else
		{
			alert('Sorry! No parsed files')
		}
	}
	else
	{
		alert("Sorry! No file list")
	}
}