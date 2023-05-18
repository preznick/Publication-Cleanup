// Add common JS files
#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/commonConsts.jsx";
#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/adIDConsts.jsx";
#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/regExConsts.jsx";

#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/jsUtilities.jsx";
#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/scriptingUtilities.jsx";

// ----------------------------------------------------------------
// Declare constants

const MrktFldrNamePttrn = /([A-Z]{2})-([A-Z]*)/;
const YearAndMnth       = /(\d{2})(\d{2})/;

const BckUpVolum        = "/Volumes/Backup_01/";
const BckUpFrmPgs       = "zzPrinter Form Archives/";

const sleepScnds        = 1;

// We need the folder where the Text (Zone) files are located since
// everything else is based on the location of this folder.

var textFileFolder  = Folder.selectDialog("Select previous months folder\r" 
                                        + "Select the folder that contains the text files for the month you wish to clear out.");
if(textFileFolder)
{
    var    mrktFolder   = new Folder(textFileFolder.parent.parent);

    var mnthYearArray   = TextFileFldrPattern.exec( decodeURI(textFileFolder.name) );
    var theMrktArray    =   MrktFldrNamePttrn.exec( decodeURI(    mrktFolder.name) );

    // ----------------------------------------------------------------
    // Progress Window Setup

    var win = new Window( "palette", "Deleting previous months files", [100,220,500,280] );

    win.proBar          = win.add( "progressbar", [12,12,388,24], 0, 10              );
    win.fileCopyText    = win.add( "edittext",    [12,30,388,50], "Deleting folders" );

    win.fileCopyText.onChange = function()
    {
        this.graphics.drawOSControl();
    }

    win.proBar.value = 0;

    // ----------------------------------------------------------------

    // Report File Set up
    // Create a report file to keep a record of what has transpired

    var reportFile = new File("~/Desktop/Cleanup Reports/" + mnthYearArray[0] + "_Cleanup.txt");

    if( !(reportFile == undefined) )
    {
        reportFile.open ('w');
        reportFile.write("FOLDER CLEANUP REPORT FILE FOR "           + mnthYearArray[1] + " " + theMrktArray[2] + "\r");
        reportFile.write("=========================================" + "\r\r" );
    }
    else
    {
        alert("Sorry, could not create report file\r");
    }

    // ----------------------------------------------------------------

    // Make sure the user selected a legitimate folder and that we have
    // a valid folder object.

    if ( ((textFileFolder == null) || (textFileFolder == undefined)) || !(textFileFolder.exists) )
    {
        var errText = "Oops! Bad things have happened." + "\r"
                    + "Sorry something went wrong"      + "\r";

        alert(errText);
        reportFile.write(errText);
    }
    else
    {

        if( mnthYearArray || theMrktArray )
        {
            // ----------------------------------------------------------------
            // We will need these different 'name' parts in order to find the
            // folders we need based on Market and Issue.

            var theMarket    = mnthYearArray[3];
            var theYearMnth  = mnthYearArray[2];
            var mrktAndMnth  = mnthYearArray[1];

            var theYear      = ( YearAndMnth.exec(theYearMnth) )[2];

            // ----------------------------------------------------------------
            // We need to create Folder objects for all the directories we need
            // access to.

            var cmnPthName      =    mrktFolder.fullName + "/" + theMarket;

            // The InDesign files/forms
            var    fnlBldFolder = new Folder( cmnPthName + "-BookBuilding/"      + theYearMnth + "-Final Builds"    );

            // The JSON files that keeps track of the ads that have been placed into forms
            var    bltJsnFolder = new Folder( cmnPthName + "-Built JSON Files/"  + mrktAndMnth + " Built Files"     );

            // The JSON files that hold the positons of the zone code for ads
            var    zoneCdFolder = new Folder( cmnPthName + "-Zone Codes/"        + mrktAndMnth + " Zone Code Files" );

            // The Pre-Build InDesign files
            var  preBuildFlder  = new Folder( cmnPthName + "-Proofing Builds/"   + theYearMnth + "-Proofing Builds" );

            // The folder containing the Batched PDF files
            var      btchFolder = new Folder( cmnPthName + "-"                   + theYearMnth + "_Batched"         );

            // Forms folder
            var  hiResPrfFolder = new Folder( cmnPthName + "-Forms/"             + theYearMnth + "-High Res Proofing Forms" );
            var preBldPDFFolder = new Folder( cmnPthName + "-Forms/"             + mrktAndMnth + "-Proofing PDF Files"      );
            var  prntFrmsFolder = new Folder( cmnPthName + "-Forms/"             + theMarket   + "_" + theYearMnth          );

            // Cover Sheet folder
            var cvrShtPDFFolder = new Folder( cmnPthName + "-Form Cover Sheets/" + theYearMnth + "_Cover Sheet PDFs"        );
            var  cvrShtIDFolder = new Folder( cmnPthName + "-Form Cover Sheets/" + theYearMnth + "_Cover Sheets"            );

            // Proofs folders
            var lowResPrfFolder = new Folder( cmnPthName + "-Proofs/" + "Lo Res Proofs/"     + mrktAndMnth + " " + theMrktArray[2] + " Proof Files/"       );
            var     psPrfFolder = new Folder( cmnPthName + "-Proofs/" + "PS Proofing Files/" + theYearMnth + "_" + theMarket                               );
            var  pgntnPrfFolder = new Folder( cmnPthName + "-Proofs/" + "Pagination Proofs/" + mrktAndMnth + " " + theMrktArray[2] + " Pagination Proofs/" );

            // var   cpnMrktFolder = new Folder( cmnPthName + "-"                   + theYearMnth + "_Coupons"                     );
            // var cpnBackupFolder = new Folder( BckUpVolum + "20" + theYear + "/"  + mrktObj[ theMarket ] + "/" + mrktFolder.name );

            // ----------------------------------------------------------------

            // Make the progress window visible
            win.show();

            // ----------------------------------------------------------------
            // Start deleting the folders we no longer need.

            
            // Delete Pagination Proofs folder for previous month
            if( isFolderThere(pgntnPrfFolder, reportFile) )
            { 
                removeFolder(pgntnPrfFolder, reportFile, win);
            }

            // Delete Low Res Proofs folder for previous month
            if( isFolderThere(lowResPrfFolder, reportFile) )
            { 
                removeFolder(lowResPrfFolder, reportFile, win);
            }

            // sleep(sleepScnds);

            // Delete Postscript files and folder from previous month
            if( isFolderThere(psPrfFolder, reportFile) )
            { 
                removeFolder(psPrfFolder, reportFile, win);
            }

            sleep(sleepScnds);
            
            // Delete Pre-build Folder and all InDesign files
            if( isFolderThere(preBuildFlder, reportFile) )
            { 
                removeFolder(preBuildFlder, reportFile, win);
            }

            // sleep(sleepScnds);

            // Delete the Final Build folder and all InDesign files
            if( isFolderThere(fnlBldFolder, reportFile) )
            { 
                removeFolder(fnlBldFolder, reportFile, win);
            }

            // sleep(sleepScnds);

            // Delete month's Built folder and all JSON files
            if( isFolderThere( bltJsnFolder, reportFile) )
            {
                removeFolder(bltJsnFolder, reportFile, win);
            }

            // sleep(sleepScnds);

            // Delete month's Zone Code folder and all JSON files
            if( isFolderThere( zoneCdFolder, reportFile) )
            {
                removeFolder(zoneCdFolder, reportFile, win);
            }

            sleep(sleepScnds);

            // Delete the Pre-Build PDF folder and all PDF files
            if( isFolderThere( preBldPDFFolder, reportFile) )
            {
                removeFolder(preBldPDFFolder, reportFile, win);
            }

            // sleep(sleepScnds);

            // Delete month's Hi Res proofing folder and all PDF files
            if( isFolderThere( hiResPrfFolder, reportFile) )
            {
                removeFolder(hiResPrfFolder, reportFile, win);
            }

            // sleep(sleepScnds);

            // Delete month's PDF folder and all PDF files
            if( isFolderThere( cvrShtPDFFolder, reportFile) )
            {
                removeFolder(cvrShtPDFFolder, reportFile, win);
            }

            // sleep(sleepScnds);

            // Delete month's Cover Sheet Folder and all InDesign files
            if( isFolderThere( cvrShtIDFolder, reportFile) )
            {
                removeFolder(cvrShtIDFolder, reportFile, win);
            }

            // Delete month's Zone (Text File) folder and all files
            if( isFolderThere( textFileFolder, reportFile) )
            {
                removeFolder(textFileFolder, reportFile, win);
            }

            sleep(sleepScnds);
            

            // ----------------------------------------------------------------
            // Find (or create) a folder for the correct year on the Backup volume
            

            var bckUpFldr = createFolderFromPath(BckUpVolum + "/" + "20" + theYear + "/");

            // Move the High Res printer pages to the Backup Directory, *if* both the
            // source and backup directories exist.

            if( prntFrmsFolder.exists && bckUpFldr.exists )
            {
                movePrintFilesToBackup(bckUpFldr, reportFile);
            }
            else
            {
                reportFile.write( "This folder may have already been deleted\r" + decodeURI(prntFrmsFolder.fullName) + "\r\r");
            }
            

            // ----------------------------------------------------------------

            
            var bckUpBtchFldr = createFolderFromPath( "~/Desktop/Batched/" + theMrktArray[2] + "/" );

            // Move the Batched PDF files to the local backup Directory, *if* both the
            // source and backup directories exist.

            if(bckUpBtchFldr.exists && btchFolder.exists)
            {
                moveFolderAndDelete(btchFolder, bckUpBtchFldr, reportFile,false);
            }
            else
            {
                reportFile.write( "This folder may have already been deleted\r" + decodeURI(btchFolder.fullName) + "\r\r");
            }
             
            
            // We're done in the Finder, so let's pop back over to InDesign

            var reactivateString = "";

            reactivateString += "on run\r"
            reactivateString += "tell application \"Adobe InDesign 2023\"\r";
            reactivateString += "activate\r";
            reactivateString += "end tell\r";
            reactivateString += "end run";

            var value = app.doScript(reactivateString, ScriptLanguage.APPLESCRIPT_LANGUAGE);

        }
        else
        {
            alert("Well... something went wrong");
        }

        win.close();
    };

    reportFile.close()
    reportFile.execute();
}

function movePrintFilesToBackup(bckUpFldr, reportFile)
{
    if(bckUpFldr.exists)
    {
        var backUpFormPgsFldr = createFolderFromPath( bckUpFldr.fullName + "/" + BckUpFrmPgs );

        if(backUpFormPgsFldr.exists)
        {
            var yearBackUpFldr = createFolderFromPath( backUpFormPgsFldr + "/" + theMarket + " " + "Forms/");

            if(yearBackUpFldr.exists)
            {
                var bookTypeFldr = createFolderFromPath(yearBackUpFldr + "/" + theMrktArray[2] + "/")

                moveFolderAndDelete(prntFrmsFolder, bookTypeFldr, reportFile);
            }
        }
    }
}

function removeFolder(theFolder, theReportFile, win, tabCnt)
{
    var theItems = theFolder.getFiles();
    var fldrName = decodeURI(theFolder.name);
    var theTabs  = "";

    var dLogText    = "Deleting "     + theItems.length + " items from folder: " + fldrName;
    var dltFldrTxt  = "The folder \"" + fldrName        + "\"";

    if(tabCnt == undefined)
        tabCnt = 0;

    for(var count = 0; count < tabCnt; count++)
        theTabs += "\t";

    win.proBar.maxvalue = theItems.length - 1;
    win.proBar.value = 0;

    win.fileCopyText.text = dLogText;
    win.fileCopyText.notify("onChange");

    theReportFile.write(theTabs + dLogText + "\r" );

    if(theItems)
    {
        win.proBar.maxvalue = theItems.length - 1;

        for(var f = 0; f < theItems.length; f++)
        {
            if(theItems[f].constructor === Folder)
            {
                removeFolder(theItems[f], theReportFile, win, tabCnt + 1);

                win.proBar.maxvalue   = theItems.length - 1;
                win.proBar.value      = f;

                win.fileCopyText.text = "Delete items from folder: " + fldrName;
                win.fileCopyText.notify("onChange");
            }
            else
            {
                theReportFile.write( theTabs + decodeURI(theItems[f].name) );

                if( theItems[f].remove() )
                {
                    theReportFile.write( ": Deleted"         + "\r" );
                }
                else
                {
                    theReportFile.write( ": Was not deleted" + "\r" );
                }
            }

            win.proBar.value = f;
        }
    }
    else
    {
        theReportFile.write("\t\n" + fldrName + " contained no files\r");
    }

    if( theFolder.remove() )
        theReportFile.write( theTabs + dltFldrTxt + ": Has been deleted" + "\r\r" );
    else
        theReportFile.write( theTabs + dltFldrTxt + ": Was not deleted"  + "\r\r" );

}