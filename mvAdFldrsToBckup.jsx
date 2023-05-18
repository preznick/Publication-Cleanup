// Add common JS files

#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/commonConsts.jsx";
#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/adIDConsts.jsx";
#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/regExConsts.jsx";

#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/jsUtilities.jsx";
#include "/Volumes/Volume_06/Book Building Data/JS_Files/Common/scriptingUtilities.jsx";

// ----------------------------------------------------------------
//
// Declare constants
//

const MrktFldrNamePttrn = /([A-Z]{2})-([A-Z]*)/;
const YearAndMnth       = /(\d{2})(\d{2})/;

const BckUpVolum        = "/Volumes/Backup_01/";
const ArchvVolum        = "/Volumes/14TB_Backup/";

const sleepScnds        = 1;

const mrktObj           =   {
                                "BT":"Test Market",
                                "CH":"Chicago",
                                "DT":"Detroit",
                                "FL":"Florida",
                                "TC":"Twin Cities"
                            };

const dstNtAvlbl        = "Cannot proceed without destination volume available";

// ----------------------------------------------------------------
//
// Set up the needed variables
//

var theFoldersObj       =   {
                                // The coupon/ad folders
                                "cpnFldrs":
                                {
                                    "src":null,
                                    "dst":
                                    {
                                        "bckUp":null,
                                        "archv":null
                                    }
                                },

                                // DAL folders
                                "dalFldrs":
                                {
                                    "src":null,
                                    "dst":
                                    {
                                        "bckUp":null,
                                        "archv":null
                                    }
                                },

                                // Insert folders
                                "insFldrs":
                                {
                                    "src":null,
                                    "dst":
                                    {
                                        "bckUp":null,
                                        "archv":null
                                    }
                                }
                            };

// We need the folder where the Text (Zone) files are located since
// everything else is based on the location of this folder.
var textFileFolder  = Folder.selectDialog("Select previous months folder\r" 
                                        + "Select the folder that contains the text files for the month you wish to clear out.");


// ----------------------------------------------------------------
//
// Let's make sure the destination volumes are available
//

var proceed = false;

var bckVlmFlder = new Folder(BckUpVolum);
var arcVlmFlder = new Folder(ArchvVolum);

if(!bckVlmFlder.exists)
{
    alert( BckUpVolum.split("/")[2] + " volume is not mounted\r" + dstNtAvlbl);
}
else
{
    if(!arcVlmFlder.exists)
    {
        alert( ArchvVolum.split("/")[2] +  " archive volume is not mounted\r" + dstNtAvlbl);
    }
    else
    {
        proceed = true;
    }
}

// ----------------------------------------------------------------

if(proceed)
{
    if( textFileFolder.exists )
    {
        // The main market folder on a particular volume (i.e. "1 SAVE_Chicago", "1 SAVE_Detroit")
        var mainFolder      = new Folder(textFileFolder.parent.parent.parent);

        // Sub folder from main market folder for the publication type (i.e. "DT-SOE", "CH-HPG")
        var mrktFolder      = new Folder(textFileFolder.parent.parent);

        // Echo the folder name so the user gets a general idea that
        // they selected the correct folder.
        alert( "Moving ad folders to the Backup and Archive volumes for this market\r" + decodeURI(mrktFolder.name) );

        if(mrktFolder.exists)
        {
            var mnthYearArray   = TextFileFldrPattern.exec( decodeURI(textFileFolder.name) );
            var theMrktArray    =   MrktFldrNamePttrn.exec( decodeURI(    mrktFolder.name) );

            if( mnthYearArray || theMrktArray )
            {
                // We will need these different name 'sections' in order to find the
                // folders we need based on Market, Issue and Publication type.

                var theMarket    = mnthYearArray[3];
                var theYearMnth  = mnthYearArray[2];
                var mrktAndMnth  = mnthYearArray[1];

                var thePubType   = theMrktArray[2];

                var theYear      = ( YearAndMnth.exec(theYearMnth) )[2];

                var dalFolderNme = theMarket + "-" + theYearMnth  + "_" + thePubType + "_" + "DALs";
                var istFolderNme = theMarket + "-" + theYearMnth  + "_" + thePubType + "_" + "Inserts";

                // ----------------------------------------------------------------
                // 
                // We need to create Folder objects for all the directories we need
                // access to.
                //

                // The source Folder objects to the DAL folders for the current ads
                var    dalFolder    = new Folder( decodeURI(mainFolder) + "/" +  theMarket + "-" + thePubType   + "_DAL"     + "/" + theMarket 
                                                                        + "-Current Files" + "/" + dalFolderNme + "/" );
     
                // The source Folder objects to the Inserts folders for the current ads
                var insertFolder    = new Folder( decodeURI(mainFolder) + "/" +  theMarket + "-" + thePubType   + "_Inserts" + "/" + theMarket 
                                                                        + "-Current Files" + "/" + istFolderNme + "/" );

                // Common path name part for coupons/book ads
                var cmnPthName      =    mrktFolder.fullName + "/" + theMarket;

                // The source  Folder object to the Coupon folder for the current ads
                var   cpnMrktFolder = new Folder( cmnPthName + "-" + theYearMnth + "_Coupons" );

                // Store the source Folder objects in the folder collection object
                theFoldersObj["cpnFldrs"]["src"] = cpnMrktFolder;

                // Not every market/publication type will have DAL and Insert files
                // so let's check and see if the source folders even exist
                if(dalFolder.exists)
                    theFoldersObj["dalFldrs"]["src"] = dalFolder;

                if(insertFolder.exists)
                    theFoldersObj["insFldrs"]["src"] = insertFolder;

                // ----------------------------------------------------------------

                // Common path section to the Backup and Archive volumes
                var cmnBckupPathPrt = ( BckUpVolum + "20" + theYear + "/"  + mrktObj[ theMarket ] + "/" );
                var cmnArchvPathPrt = ( ArchvVolum + "20" + theYear + "/"  + mrktObj[ theMarket ] + "/" );

                // We need to create the Folder objects to the BackUp folders we will be copying to
                var  cpnBackupFolder    = new Folder( cmnBckupPathPrt + mrktFolder.name );
                var  dalBackupFolder    = new Folder( cmnBckupPathPrt + theMarket + "-" + thePubType + " DALs"     + "/" );
                var instBackupFolder    = new Folder( cmnBckupPathPrt + theMarket + "-" + thePubType + " Inserts"  + "/" );

                // We need to create the Folder objects to the Archive folders we will be copying to
                var  cpnArchivFolder    = new Folder( cmnArchvPathPrt + mrktFolder.name );
                var  dalArchivFolder    = new Folder( cmnArchvPathPrt + theMarket + "-" + thePubType + " DALs"     + "/" );
                var instArchivFolder    = new Folder( cmnArchvPathPrt + theMarket + "-" + thePubType + " Inserts"  + "/" );

                // Store the destinstion Folder objects in the folder collection object
                theFoldersObj["cpnFldrs"]["dst"]["bckUp"] = cpnBackupFolder;
                theFoldersObj["dalFldrs"]["dst"]["bckUp"] = dalBackupFolder;
                theFoldersObj["insFldrs"]["dst"]["bckUp"] = instBackupFolder;

                theFoldersObj["cpnFldrs"]["dst"]["archv"] = cpnArchivFolder;
                theFoldersObj["dalFldrs"]["dst"]["archv"] = dalArchivFolder;
                theFoldersObj["insFldrs"]["dst"]["archv"] = instArchivFolder;

                // ----------------------------------------------------------------
                //
                // Report file setup
                //

                var reportFile = new File( "~/Desktop/Cleanup Reports/" + mnthYearArray[0] + "_MoveAdsToBackupVolume.txt" );

                if( reportFile != undefined )
                {
                    reportFile.open ( 'w' );

                    reportFile.write( "MOVE ADS FOLDERS TO BACKUP. REPORT FILE FOR "           + mnthYearArray[1] + " " + theMrktArray[2] + "\r" );
                    reportFile.write( "======================================================" + "\r\r" );
                }
                else
                {
                    alert( "Sorry, could not create report file\r" );
                }

                // ----------------------------------------------------------------

                // No sense in continuing if the destination folders are not
                // available and/or can't be created
                if( createDestFolders(theFoldersObj) )
                {

                    // ----------------------------------------------------------------
                    //
                    // Create the files objects we will use to write the needed Apple scripts
                    //

                    // Apple script file objects used to copy to BackUp and Archive volumes
                    var bckUpScptFile    = new File( "~/Desktop/Run Apple Scripts/bckUpFldrs.scpt" );
                    var archvScptFile    = new File( "~/Desktop/Run Apple Scripts/archvFldrs.scpt" );

                    /*
                    // Apple script file objects used to copy to backup volume
                    var bookScrtFile    = new File( "~/Desktop/Run Apple Scripts/mvCpnFldrs.scpt" );
                    var  dalScrtFile    = new File( "~/Desktop/Run Apple Scripts/mvDALFldrs.scpt" );
                    var  istScrtFile    = new File( "~/Desktop/Run Apple Scripts/mvInsFldrs.scpt" );

                    // Apple script file objects used to copy to archive volume
                    var bookArchFile    = new File( "~/Desktop/Run Apple Scripts/arCpnFldrs.scpt" );
                    var  dalArchFile    = new File( "~/Desktop/Run Apple Scripts/arDALFldrs.scpt" );
                    var  istArchFile    = new File( "~/Desktop/Run Apple Scripts/arInsFldrs.scpt" );
                    */

                    // ----------------------------------------------------------------

                    // Let's attempt moving the needed folders. Reports any errors.
                    
                    /*
                    // Move to backup folders on server
                    tryFolderMove( cpnMrktFolder,  cpnBackupFolder, reportFile, bookScrtFile );
                    tryFolderMove(     dalFolder,  dalBackupFolder, reportFile,  dalScrtFile );
                    tryFolderMove(  insertFolder, instBackupFolder, reportFile,  istScrtFile );

                    // Move to archive folders on external drive
                    tryFolderMove( cpnMrktFolder,  cpnArchivFolder, reportFile, bookArchFile );
                    tryFolderMove(     dalFolder,  dalArchivFolder, reportFile,  dalArchFile );
                    tryFolderMove(  insertFolder, instArchivFolder, reportFile,  istArchFile );
                    */

                    // Set up the Apple Scripts and report any errors
                    setUpAppleScpts( theFoldersObj, reportFile, bckUpScptFile, archvScptFile);

                    bckUpScptFile.close();
                    bckUpScptFile.execute();
                
                    archvScptFile.close();
                    archvScptFile.execute();

                }

                reportFile.close();
                reportFile.execute();

            }
            else
            {
                alert("Could not extract text")
            }
        }
        else
        {
            alert("The market folder could not be found");
        }
    }
    else
    {
        alert("The zone texfile folder could not be found");
    }
}

function createDestFolders(fldrCllctnObj)
{
    var bckUpDestFldr;
    var arcveDestFldr;

    var theSrceFldr;

    var pass = false;

    for(var theKey in fldrCllctnObj)
    {
        theSrceFldr     = fldrCllctnObj[theKey][ "src" ];
        bckUpDestFldr   = fldrCllctnObj[theKey][ "dst" ][ "bckUp" ];
        arcveDestFldr   = fldrCllctnObj[theKey][ "dst" ][ "archv" ];

        // If the souce folder does not exist, no much sense in 
        // creating the destination
        if(theSrceFldr.exists)
        {
            if( createFolderFromPath( bckUpDestFldr.fullName ) )
            {
                if( createFolderFromPath( arcveDestFldr.fullName ) )
                {
                   // We're cool! Keep going.
                   pass = true;
                }
            }
        }
    }
    
    return pass;
}

function setUpAppleScpts(fldrCllctnObj, reportFile, bckUpScptFile, archvScptFile)
{
    var bckUpFlderString = "";
    var archvFlderString = "";

    var bckUpDestFldr;
    var arcveDestFldr;

    var theSrceFldr;

    bckUpFlderString += "tell application \"Finder\"";
    bckUpFlderString +=    "\ractivate\r\r";

    archvFlderString = bckUpFlderString;

    for(var theKey in fldrCllctnObj)
    {
        theSrceFldr     = fldrCllctnObj[theKey][ "src" ];
        bckUpDestFldr   = fldrCllctnObj[theKey][ "dst" ][ "bckUp" ];
        arcveDestFldr   = fldrCllctnObj[theKey][ "dst" ][ "archv" ];

        // Is the source folder even there?
        if(theSrceFldr)
        {

            bckUpFlderString +=    "set orgFlder to POSIX file \"" +  decodeURI( theSrceFldr.fsName   ) + "\"\r";
            archvFlderString +=    "set orgFlder to POSIX file \"" +  decodeURI( theSrceFldr.fsName   ) + "\"\r";

            bckUpFlderString +=    "set dstFlder to POSIX file \"" +  decodeURI( bckUpDestFldr.fsName ) + "\"\r";
            archvFlderString +=    "set dstFlder to POSIX file \"" +  decodeURI( arcveDestFldr.fsName ) + "\"\r";

            bckUpFlderString +=    "move orgFlder to dstFlder with replacing\r\r";
            archvFlderString +=    "move orgFlder to dstFlder with replacing\r\r";

            reportFile.write( "Creating Applescript to move folder\r\t" + decodeURI( theSrceFldr.fsName ) + "\r"
                            + " to Backup folder\r\t"      + decodeURI( bckUpDestFldr.fsName ) + "\r" 
                            + " and Archive folder\r\t"    + decodeURI( arcveDestFldr.fsName ) + "\r\r" );
        }
        else
        {
            reportFile.write( "This source folder was not found. It may have already been moved to the Backup Volume:\r\t" + decodeURI(bckUpDestFldr.fullName) + "\r\r");
        }
    }

    bckUpFlderString += "end tell";
    archvFlderString += "end tell";

    bckUpScptFile.open('w');
    bckUpScptFile.write(bckUpFlderString);

    archvScptFile.open('w');
    archvScptFile.write(archvFlderString);

    alert( "Saving Apple Script files to desktop\r" +  "Open these files in Script Editor to run them ");
}

/*
function tryFolderMove(theOrgFolder, bckUpFldr, reportFile, theScrtFile)
{
    if( theOrgFolder.exists )
    {
        moveCouponFolderToBackup( theOrgFolder,bckUpFldr, reportFile, true, theScrtFile );
    }
    else
    {
        alert( "Sorry, the ad folder " + decodeURI( theOrgFolder.name ) + " was not found\r" 
             + "It's possible this folder has already been moved to the backup volume" );

        reportFile.write( "This folder was not found. It may have already been moved to the Backup Volume\r" + decodeURI(theOrgFolder.fullName) + "\r\r");
    }

}

function moveCouponFolderToBackup(theOrgFolder, bckUpFldr, reportFile, dsplyAlert, theScrtFile)
{
    // Create the backup folder if we need to.
    if( createFolderFromPath( bckUpFldr.fullName ) )
    {
        // Does the backup folder exist now?
        if( isFolderThere( bckUpFldr, reportFile ) )
        {
            // Did we have the original folder?
            if( isFolderThere( theOrgFolder, reportFile ) )
            {
                // If everything is there, let's move the coupons to the backup volume
                moveFolderAndDelete( theOrgFolder, bckUpFldr, reportFile, dsplyAlert, theScrtFile );
            }
        }
    }
}
*/
