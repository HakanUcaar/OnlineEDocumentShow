import React, { Component } from 'react';
import { withStyles, createMuiTheme } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import InputBase from '@material-ui/core/InputBase';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import FolderIcon from '@material-ui/icons/Folder';
import ClearIcon from '@material-ui/icons/Clear';
import Container from '@material-ui/core/Container';
import { Button } from '@material-ui/core';

const theme = createMuiTheme();
const useStyles = {
    lvl1:{
        display: "flex",
        
    },
    lvl2:{
        flexGrow: "1",
        maxWidth: "100%",
        overflowX: "hidden"
    },
    lvl3:{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "transform 195ms",
        minHeight: "95vh"
    },
    mainroot:{
        margin : '15px'
    },
    InoviceRoot:{
        position: 'relative',
        margin: 'auto',
        width: '850px'
    },
    root: {
        marginTop:'8px',
        display: 'flex',
        alignItems: 'center',
        width: '100%',       
    },
    input: {
        marginLeft: theme.spacing(1),
        flex: 1,
    },
    iconButton: {
        padding: 10,
    },
    divider: {
        height: 28,
        margin: 4,
    },
    actions:{
        marginTop:'8px',
        textAlign: "center",
    },
    actionButton:{
        marginRight:"5px"
    }
};

class MainPage extends Component {
    constructor(props){
        super(props);

        this.state = {
            xmlFilePath : null,
            xsltFilePath : null,
            xmlFile : null,
            xsltFile: null,
            resultInvoice : null            
        }
    }

    buildFileSelector=()=>{
        const fileSelector = document.createElement('input');
        fileSelector.setAttribute('type', 'file');
        fileSelector.setAttribute('multiple', 'multiple');
        return fileSelector;
    }

    componentDidMount=()=>{
        this.fileSelectorXml = this.buildFileSelector();
        this.fileSelectorXml.onchange = (e) =>this.onHandleXmlFileSelectorChange(e);
        this.fileSelectorXslt = this.buildFileSelector();
        this.fileSelectorXslt.onchange = (e) =>this.onHandleXsltFileSelectorChange(e);        
    }

    onHandleXmlFileSelectorChange=(e)=>{
        this.setState({xmlFilePath : e.target.files[0].name});
        let file = e.target.files[0];
        let reader = new FileReader();

        try {
            reader.onload = (e) =>{
                this.setState({xmlFile:e.target.result})
            };
            reader.readAsText(file);
        } catch (error) {
            this.setState({xmlFilePath:"",xmlFile:null});
        }  
    }

    onHandleXsltFileSelectorChange=(e)=>{
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            this.setState({xsltFilePath:e.target.files[0].name});
            let file = e.target.files[0];
            let reader = new FileReader();
            try {
                reader.onload = (e) =>{
                    this.setState({xsltFile:e.target.result});
                }
                reader.readAsText(file);
            } catch (error) {
                this.setState({xsltFilePath:"",xsltFile:null});
            }    
        } else {
            alert("Your browser is too old to support HTML5 File API");
        }        
    }    
    
    onXmlFileClear=()=>{
        this.fileSelectorXml.value = "";
        this.setState({xmlFile:null,xmlFilePath:""});
    }

    onXsltFileClear=()=>{
        this.fileSelectorXslt.value = "";
        this.setState({xsltFile:null,xsltFilePath:""});
    }

    handleXmlFileSelect = (e) => {
        e.preventDefault();        
        this.fileSelectorXml.click();        
    }

    handleXsltFileSelect = (e) => {
        e.preventDefault();        
        this.fileSelectorXslt.click();        
    }    

    pdfSettings=()=> {
        var paperSizeArray = ["A4", "A5"];
        var option = {
            landscape: false,
            marginsType: 0,
            printBackground: false,
            printSelectionOnly: false,
            pageSize: paperSizeArray[0],
        };
      return option;
    }

    shortDate = () =>{
        let date = new Date().toLocaleString();
        date = date.split(" ").join("-");
        date = date.split(".").join("-");
        date = date.split(":").join("-");
        return  date;
    }

    onSaveClick=async()=>{
        if(this.state.resultInvoice)
        {
            let fs = window.require("fs");
            const electron = window.require('electron');
            const BrowserWindow = electron.remote.BrowserWindow;        
            let BrowWindow = new BrowserWindow({ 
                width: 900, 
                height: 680,
                webPreferences: {
                    nodeIntegration: true
                },
                show : false           
            });
            
            let app = (electron.app || electron.remote.app);
            let appPath =app.getPath('desktop');
            await fs.writeFile(appPath+'/tempEInvoice.html', this.state.resultInvoice,(error)=>{
                if(error)
                {
                    alert("Hata");
                }
                console.log("file:///"+appPath+"/tempEInvoice.html");

                BrowWindow.loadURL("file:///"+appPath+"/tempEInvoice.html");
            });
           
            BrowWindow.webContents.on('did-finish-load', () => {
                // Use default printing options
                BrowWindow.webContents.printToPDF(this.pdfSettings()).then(data => {
                    fs.writeFile(app.getPath('desktop')+"/"+this.shortDate()+'.pdf', data, (error) => {
                    if (error) 
                    {
                        console.log(error);
                        fs.unlink(appPath+"/tempEInvoice.html", function (err) {
                            if (err) throw err;
                            console.log('File deleted!');
                        }); 
                        BrowWindow.close();
                    }

                    console.log('Write PDF successfully.')
                    BrowWindow.close();
                  })
                }).catch(error => {
                  console.log(error)
                  BrowWindow.close();
                })
            })
        }
    }
  
    onShowClick=()=>{
        if(this.state.xmlFilePath){           

            let parser = new DOMParser();
            let xmlDoc = parser.parseFromString(this.state.xmlFile, "text/xml");
            let xsltDoc = null;
            let Attachment = xmlDoc.getElementsByTagName("cbc:EmbeddedDocumentBinaryObject")[0].textContent;

            if(Attachment !== undefined && (this.state.xsltFilePath === "" || this.state.xsltFilePath === null))
            {
                xsltDoc = parser.parseFromString(Buffer.from(Attachment, 'base64').toString('utf-8'), "text/xml");
            }
            else{
                xsltDoc = parser.parseFromString(this.state.xsltFile, "text/xml");
            }

            let xsltProcessor=new XSLTProcessor();
            xsltProcessor.importStylesheet(xsltDoc);
            let resultDocument = xsltProcessor.transformToFragment(xmlDoc,document);
            if(resultDocument != null)
            {
                document.getElementById("example").innerHTML = "";
                document.getElementById("example").appendChild(resultDocument); 
                this.setState({resultInvoice:document.getElementById("example").innerHTML});          
            }                
        }
    }

    onInputChange=(e)=>{
        this.setState({xmlFilePath:e.target.value});
    }

    render(){
        const {classes} = this.props;
        return (
            <div className={classes.lvl1}>
                <div className={classes.lvl2}>                       
                    <div className={classes.lvl3}>   
                        <Container maxWidthXl>
                            <div className={classes.mainroot}>                                                        
                                <Paper component="form" className={classes.root}>
                                    <InputBase
                                        className={classes.input}
                                        placeholder="Xml Dosyasını Seç"
                                        value = {this.state.xmlFilePath}
                                        disabled = {true}
                                    />
                                    <IconButton className={classes.iconButton} aria-label="folder" onClick={this.handleXmlFileSelect}>
                                        <FolderIcon />
                                    </IconButton>
                                    <IconButton className={classes.iconButton} aria-label="folder" onClick={this.onXmlFileClear}>
                                        <ClearIcon />
                                    </IconButton>                    
                                </Paper>
                                <Paper component="form" className={classes.root}>
                                    <InputBase
                                    className={classes.input}
                                    placeholder="Xslt Dosyasını Seç"
                                    value = {this.state.xsltFilePath}
                                    disabled = {true}
                                    />
                                    <IconButton className={classes.iconButton} aria-label="folder" onClick={this.handleXsltFileSelect}>
                                        <FolderIcon />
                                    </IconButton>
                                    <IconButton className={classes.iconButton} aria-label="folder" onClick={this.onXsltFileClear}>
                                        <ClearIcon />
                                    </IconButton>                    
                                </Paper>    
                                <Divider orientation='horizontal' variant ='fullWidth'/>
                                <div className={classes.actions}>
                                    <Button className={classes.actionButton} variant="contained" color="primary" onClick = {this.onShowClick}>Faturayı Göster</Button> 
                                    <Button className={classes.actionButton} variant="contained" color="primary" onClick = {this.onSaveClick}>Faturayı Kaydet</Button>
                                </div>

                                    <div>
                                        <div className={classes.InoviceRoot} id="example" >
                                        </div>      
                                    </div>
                            </div>
                        </Container>
                    </div>
                </div>          
            </div>  
        );
    }
}

export default withStyles(useStyles)(MainPage);