import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import openSocket from 'socket.io-client';
import Find from 'lodash/find';
import Size from 'lodash/size';
import Reduce from 'lodash/reduce';
import Papa from 'papaparse';
import ScrollArea from 'react-scrollbar';
import Grid from 'material-ui/Grid';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import DeleteIcon from 'material-ui-icons/Delete';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import Card, { CardContent } from 'material-ui/Card';
import { FormGroup } from 'material-ui/Form';
import Checkbox from 'material-ui/Checkbox';
import TextField from 'material-ui/TextField';
import { InputLabel } from 'material-ui/Input';
import Select from 'material-ui/Select';
import { MenuItem } from 'material-ui/Menu';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import Slide from 'material-ui/transitions/Slide';
import Tabs, { Tab } from 'material-ui/Tabs';
import List, {
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from 'material-ui/List';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import { CircularProgress } from 'material-ui/Progress';
import Snackbar from 'material-ui/Snackbar';
import Dropzone from 'react-dropzone';
import shortid from 'shortid';
import axios from 'axios';
import findIndex from 'lodash/findIndex';
import { CSVLink } from 'react-csv';

import './App.css';

import cnf from '../config.json';

const apiURI = cnf.api.uri;

const FileManager = React.createClass({
    getInitialState() {
        return {
            items: [],
            files: [],
            queue: [],
            csv_mapping_fields: [
              { label: 'Test datum', name: 'testDate', value: '', columnIndex: 28 },
              { label: 'Test tijd', name: 'testTime', value: '', columnIndex: 29 },
              { label: 'Getest bij', name: 'testedWith', value: '', columnIndex: 105 },
              { label: 'Klant naam', name: 'customerName', value: '', columnIndex: 2 },
              { label: 'Klant adres 1', name: 'customerAddress1', value: '', columnIndex: 3 },
              { label: 'Klant adres 2', name: 'customerAddress2', value: '', columnIndex: 4 },
              { label: 'Klant adres 3', name: 'customerAddress3', value: '', columnIndex: 5 },
              { label: 'Klant adres 4', name: 'customerAddress4', value: '', columnIndex: 6 },
              { label: 'Klant postcode', name: 'customerPostcode', value: '', columnIndex: 7 },
              { label: 'PAT Model', name: 'PATModel', value: '', columnIndex: 0 },
              { label: 'PAT Serienummer', name: 'PATSerialnumber', value: '', columnIndex: 1 },
              { label: 'Artikel nummer', name: 'articleNumber', value: '', columnIndex: 19 },
              { label: 'Artikel Serienummer', name: 'articleSerialnumber', value: '', columnIndex: 20 },
              { label: 'Artikel omschrijving', name: 'articleDescription', value: '', columnIndex: 21 },
              { label: 'Complete test status', name: 'testStatus', value: '', columnIndex: 106 },
              { label: 'Testgroep', name: 'testGroup', value: '', columnIndex: 14 },
              { label: 'Testgroep spanning', name: 'testGroupVoltage', value: '', columnIndex: 15 },
              { label: 'Testgroep omschrijving', name: 'testGroupDescription', value: '', columnIndex: 17 },
              { label: 'Testgroep status', name: 'testGroupStatus', value: '', columnIndex: 16 },
              { label: 'Test #1', name: 'test1', value: '', columnIndex: 41 },
              { label: 'Test #2', name: 'test2', value: '', columnIndex: 42 },
              { label: 'Test #3', name: 'test3', value: '', columnIndex: 43 },
              { label: 'Test #4', name: 'test4', value: '', columnIndex: 44 },
              { label: 'Test #5', name: 'test5', value: '', columnIndex: 45 },
              { label: 'Test #6', name: 'test6', value: '', columnIndex: 46 },
              { label: 'Test #7', name: 'test7', value: '', columnIndex: 47 },
              { label: 'Test #8', name: 'test8', value: '', columnIndex: 48 },
            ],
            csv_file_name: '',
            csv_headers: [],
            csv_data: [],
            csv_data_mapped: [],
            csv_dialog_open: false,
        };
    },

    onDrop(files) {
        files.forEach((f, index) => {
            if (f.type === 'text/csv') {
                files.splice(index, 1);
                this.props.onprogress(true);
                setTimeout(() => this.processCSVFile(f), 1000);
            }

            return f;
        });

        const filesWithIds = files.map(f => ({ id: shortid.generate(), file: f }));
        this.state.items = this.state.items.concat(filesWithIds);
        this.setState(this.state);
    },

    onSelectChange(checked, index) {
        this.state.items[index].selected = checked;
        this.setState(this.state);
    },

    onDelete(index) {
        this.state.items.splice(index, 1);
        this.setState(this.state);
    },

    readFile(file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            this.state.files.push(file);

            if (this.state.files.length === this.state.queue.length) { this.upload(); }
        };
        reader.onabort = () => console.log('file reading was aborted');
        reader.onerror = () => console.log('file reading has failed');

        reader.readAsDataURL(file);
    },

    upload() {
        const formData = new FormData();

        this.state.files.forEach((file) => {
            formData.append('documents', file);
        });

        axios.post(`${apiURI}/files`, formData, {
            auth: {
                username: cnf.api.auth.username,
                password: cnf.api.auth.password,
            } })
            .then(() => {
                this.state.queue.forEach((id) => {
                    this.state.items.splice(findIndex(this.state.items, item => item.id === id), 1);
                });

                this.state.files = [];
                this.state.queue = [];

                this.setState(this.state);

                setTimeout(() => {
                    this.props.onprogress(false);
                    this.props.onprocessed('De geselecteerde bestanden wordt verwerkt.');
                }, 1000);
            })
            .catch(console.log)
      ;
    },

    onProcessFilesClick() {
        this.props.onprogress(true);

        this.state.items.forEach((item) => {
            if (!item.selected) return;

            this.state.queue.push(item.id);
            this.readFile(item.file);
        });
    },

    handleCSVDialogClose() {
        this.state.csv_file_name = '';
        this.state.csv_dialog_open = false;
        this.state.csv_data_mapped = [];
        this.state.csv_headers = [];
        this.setState(this.state);
    },

    handleCSVSave() {
        this.props.onprogress(true);

        const fields = this.state.csv_mapping_fields;

        this.state.csv_data_mapped = Reduce(this.state.csv_data, (acc, arr) => {
            const row = {};

            fields.forEach((field) => {
                row[field.name] = (field.columnIndex >= 0 && arr[field.columnIndex] ? arr[field.columnIndex] : '');
            });

            acc.push(row);

            return acc;
        }, []);

        const csv = Papa.unparse(this.state.csv_data_mapped);
        const blob = new Blob([csv], { type: 'text/csv' });
        const formData = new FormData();

        formData.append('documents', blob, this.state.csv_file_name);

        axios.post(`${apiURI}/files`, formData, {
            auth: {
                username: cnf.api.auth.username,
                password: cnf.api.auth.password,
            } })
            .then(() => {
                this.state.csv_file_name = '';
                this.state.csv_dialog_open = false;
                this.state.csv_data_mapped = [];
                this.state.csv_headers = [];
                this.setState(this.state);

                setTimeout(() => {
                    this.props.onprogress(false);
                    this.props.onprocessed('CSV bestand is verstuurd naar de server.');
                }, 1000);
            });
    },

    handleCSVSelectChange(event, index) {
        const value = event.target.value;
        const columnIndex = this.state.csv_headers.indexOf(value);

        this.state.csv_mapping_fields[index].value = value;

        if (columnIndex >= 0) { this.state.csv_mapping_fields[index].columnIndex = columnIndex; }

        this.setState(this.state);
    },

    processCSVFile(local) {
        Papa.parse(local, { complete: (results) => {
            const headers = results.data[0];

            if (headers && headers.length) {
                results.data.splice(0, 1);

                this.state.csv_mapping_fields = Reduce(this.state.csv_mapping_fields, (acc, field) => {
                    const mappingField = field;

                    if (field.columnIndex >= 0 && headers[field.columnIndex]) {
                        mappingField.value = headers[field.columnIndex];
                    }

                    acc.push(mappingField);

                    return acc;
                }, []);
                this.props.onprogress(false);

                this.state.csv_file_name = local.name.toLowerCase();
                this.state.csv_headers = headers;
                this.state.csv_data = results.data;
                this.state.csv_dialog_open = true;

                this.setState(this.state);
            }

            return false;
        },
        });
    },

    render() {
        return (
            <Grid className="filemanager" container spacing={0}>
                <Grid item xs={4}>
                    <Card className="top-left">
                        <CardContent>
                            <Typography type="headline" component="h2" align="left">Bestanden</Typography>
                            <form className="upload-file-form">
                                <div className="dropzone">
                                    <Dropzone
                                        onDrop={this.onDrop}
                                        accept="text/csv, application/pdf, ">
                                        <p>Sleep bestanden in dit vak of klik op
                                        de plus knop om bestanden te selecteren.
                                        </p>
                                        <Button fab mini color="primary" aria-label="add" className="upload-file">
                                            <AddIcon />
                                        </Button>
                                    </Dropzone>
                                    {
                    Size(Find(this.state.items, { selected: true })) ?
                        <Button className="process-files" raised color="primary" onClick={this.onProcessFilesClick}>Geselecteerde bestanden verwerken</Button>
                  : ''
                  }
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={8}>
                    <Card className="top-right">
                        <CardContent>
                            <List>
                                <ScrollArea
                                    speed={0.8}
                                    className="files-list"
                                    horizontal={false}
                                    minScrollSize={40}>
                                    {this.state.items.map((obj, index) => (
                                        <ListItem
                                            key={obj.id}
                                            dense
                                            button>
                                            <Checkbox
                                                checked={obj.selected}
                                                tabIndex={-1}
                                                disableRipple
                                                onClick={e => this.onSelectChange(e.target.checked, index)} />
                                            <ListItemText primary={obj.file.name} />
                                            <ListItemSecondaryAction>
                                                <IconButton aria-label="Verwijderen" onClick={() => this.onDelete(index)}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
  ))}
                                </ScrollArea>
                            </List>
                        </CardContent>
                    </Card>
                </Grid>
                <CSVConfiguratorComponent
                    open={this.state.csv_dialog_open}
                    fields={this.state.csv_mapping_fields}
                    csv_headers={this.state.csv_headers}
                    handleClose={this.handleCSVDialogClose}
                    handleSave={this.handleCSVSave}
                    handleChange={this.handleCSVSelectChange} />
            </Grid>
        );
    },
});

FileManager.propTypes = {
    onprocessed: PropTypes.func.isRequired,
};

const Transition = props => <Slide direction="up" {...props} />;

const CSVConfiguratorComponent = props => (
    <div>
        <Dialog
            open={props.open}
            onClose={props.handleClose}
            transition={Transition}
            fullScreen
            aria-labelledby="form-dialog-title">
            <AppBar className="appBar">
                <Toolbar>
                    <IconButton color="inherit" onClick={props.handleClose} aria-label="Sluiten">
                        <CloseIcon />
                    </IconButton>
                    <Typography type="title" color="inherit" className="flex">
                CSV Mapping maken
                    </Typography>
                    <Button color="inherit" onClick={props.handleSave}>
                Verwerken
                    </Button>
                </Toolbar>
            </AppBar>
            <DialogContent className="dialogContent">
                <DialogContentText>
                      Selecteer voor elke veldnaam hieronder een kolom naam uit het CSV bestand.
                </DialogContentText>
                {props.fields.map((field, index) => (

                    <FormGroup className="csv-mapping-field" key={field.name}>
                        <InputLabel className="csv-mapping-field-label" htmlFor={field.name}>{field.label}</InputLabel>
                        <Select
                            value={field.value}
                            onChange={e => props.handleChange(e, index)}
                            inputProps={{
                                name: field.name,
                                id: field.name,
                            }}>
                            {props.csv_headers.map(col => (
                                <MenuItem key={col} value={col}>{col}</MenuItem>
      ))}
                        </Select>
                    </FormGroup>
         ))}

            </DialogContent>
        </Dialog>
    </div>
    );

const SettingsComponent = props => (
    <div>
        <Dialog
            open={props.settings.open}
            onClose={props.handleClose}
            aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Instellingen</DialogTitle>
            <DialogContent>
                <DialogContentText>
             Pas hier de instellingen aan voor het verwerken van certificaat bestanden.
                </DialogContentText>
                <Divider />
                <br />
                <FormGroup>
                    <TextField
                        id="date-certificates"
                        label="Datum voor certificaten"
                        type="date"
                        name="fixed_date"
                        onChange={props.onChangeFixedDate}
                        value={props.settings.fixed_date}
                        InputLabelProps={{
                            shrink: true,
                        }} />
                </FormGroup>
                <FormGroup>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="watch_idr"
                        name="watch_dir"
                        label="Map locatie voor certificaten"
                        type="text"
                        onChange={props.onChangeWatchDir}
                        value={props.settings.watch_dir}
                        fullWidth />
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.handleClose} color="primary">
             Sluiten
                </Button>
                <Button onClick={props.handleSave} color="primary">
             Opslaan
                </Button>
            </DialogActions>
        </Dialog>
    </div>
);

const LogComponent = props => (
    <Paper className="logs-list">
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Bericht</TableCell>
                    <TableCell>Datum/tijd</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {props.logs.map(n => (
                    <TableRow key={n.ts}>
                        <TableCell>{n.msg}</TableCell>
                        <TableCell>{Moment(n.ts, 'x').format('DD-MM-YYYY HH:mm:ss')}</TableCell>
                    </TableRow>
         ))}
            </TableBody>
        </Table>
    </Paper>
  );

const ChecklistArticles = props => (
    <Paper className="logs-list">
        <Button raised color="primary">
            <CSVLink data={props.articles} filename={`${props.type}.csv`}>Exporteer als CSV</CSVLink>
        </Button>

        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>PGROUP</TableCell>
                    <TableCell>GRPCODE</TableCell>
                    <TableCell>ITEMNO</TableCell>
                    <TableCell>DESC#1</TableCell>
                    <TableCell>DESC#2</TableCell>
                    <TableCell>DESC#3</TableCell>
                    <TableCell>LASTSER#1</TableCell>
                    <TableCell>PERIOD#1</TableCell>
                    <TableCell>CURRDEPOT</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {props.articles.map(n => (
                    <TableRow key={n.RECID}>
                        <TableCell>{n.PGROUP}</TableCell>
                        <TableCell>{n.GRPCODE}</TableCell>
                        <TableCell>{n.ITEMNO}</TableCell>
                        <TableCell>{n['DESC#1']}</TableCell>
                        <TableCell>{n['DESC#2']}</TableCell>
                        <TableCell>{n['DESC#3']}</TableCell>
                        <TableCell>{Moment(n['LASTSER#1']).format('DD-MM-YYYY HH:mm:ss')}</TableCell>
                        <TableCell>{n['PERIOD#1']}</TableCell>
                        <TableCell>{n.CURRDEPOT}</TableCell>
                    </TableRow>
           ))}
            </TableBody>
        </Table>
    </Paper>
    );

const TabContainer = props => (
    <Typography component="div" className="logs-content">
        <ScrollArea
            speed={0.8}
            className="area"
            horizontal={false}
            minScrollSize={40}>
            {props.children}
        </ScrollArea>
    </Typography>
  );

TabContainer.propTypes = {
    children: PropTypes.node.isRequired,
};

const ViewLogs = props => (
    <div className="logs-container">
        <AppBar position="static" color="default">
            <Tabs
                value={props.value}
                onChange={props.onTabsChange}
                indicatorColor="primary"
                textColor="primary">
                <Tab label="Meldingen" />
                <Tab label="Gekeurde artikelen" />
                <Tab label="Ongekeurde artikelen" />
                <Tab label="Verlopen artikelen" />
            </Tabs>
        </AppBar>
        {props.value === 0 &&
            <TabContainer>
                <LogComponent logs={props.logs} />
            </TabContainer>}
        {props.value === 1 &&
            <TabContainer>
                <ChecklistArticles type="approved" articles={props.articles.approved} />
            </TabContainer>}
        {props.value === 2 &&
            <TabContainer>
                <ChecklistArticles type="unapproved" articles={props.articles.unapproved} />
            </TabContainer>}
        {props.value === 3 &&
            <TabContainer>
                <ChecklistArticles type="expired" articles={props.articles.expired} />
            </TabContainer>}
    </div>
    );

ViewLogs.propTypes = {
    onTabsChange: PropTypes.func.isRequired,
    value: PropTypes.number.isRequired,
    logs: PropTypes.arrayOf(PropTypes.shape({
        ts: PropTypes.number.isRequired,
        msg: PropTypes.string.isRequired,
    })).isRequired,
    articles: PropTypes.shape({
        approved: PropTypes.arrayOf(PropTypes.shape({
            RECID: PropTypes.string.isRequired,
            ITEMNO: PropTypes.isRequired,
            PGROUP: PropTypes.string.isRequired,
            GRPCODE: PropTypes.string.isRequired,
            'LASTSER#1': PropTypes.string.isRequired,
            'PERIOD#1': PropTypes.number.isRequired,
            CURRDEPOT: PropTypes.string.isRequired,
            'DESC#1': PropTypes.string.isRequired,
            'DESC#2': PropTypes.string.isRequired,
            'DESC#3': PropTypes.string.isRequired,
        })).isRequired,
        unapproved: PropTypes.arrayOf(PropTypes.shape({
            RECID: PropTypes.string.isRequired,
            ITEMNO: PropTypes.isRequired,
            PGROUP: PropTypes.string.isRequired,
            GRPCODE: PropTypes.string.isRequired,
            'LASTSER#1': PropTypes.string.isRequired,
            'PERIOD#1': PropTypes.number.isRequired,
            CURRDEPOT: PropTypes.string.isRequired,
            'DESC#1': PropTypes.string.isRequired,
            'DESC#2': PropTypes.string.isRequired,
            'DESC#3': PropTypes.string.isRequired,
        })).isRequired,
        expired: PropTypes.arrayOf(PropTypes.shape({
            RECID: PropTypes.string.isRequired,
            ITEMNO: PropTypes.isRequired,
            PGROUP: PropTypes.string.isRequired,
            GRPCODE: PropTypes.string.isRequired,
            'LASTSER#1': PropTypes.string.isRequired,
            'PERIOD#1': PropTypes.number.isRequired,
            CURRDEPOT: PropTypes.string.isRequired,
            'DESC#1': PropTypes.string.isRequired,
            'DESC#2': PropTypes.string.isRequired,
            'DESC#3': PropTypes.string.isRequired,
        })).isRequired,
    }).isRequired,
};

const getArticlesLogs = () => {
    const opts = { auth: {
        username: cnf.api.auth.username,
        password: cnf.api.auth.password,
    } };

    return axios.all([
        axios.get(`${apiURI}/stock/approved`, opts),
        axios.get(`${apiURI}/stock/unapproved`, opts),
        axios.get(`${apiURI}/stock/expired`, opts),
        axios.get(`${apiURI}/logs`, opts),
        axios.get(`${apiURI}/settings`, opts),
    ]).then(axios.spread((ares, ures, eres, lres, sres) => {
        const articles = { approved: ares.data.body, unapproved: ures.data.body, expired: eres.data.body };
        const logs = lres.data.body;
        const settings = sres.data.body;

        return { logs, articles, settings };
    }));
};

class App extends React.Component {
    getInitialState: () => {
      logs: [],
      articles: {
        approved: [],
        unapproved: [],
        expired: []
      },
      files: []
    };

    subscribeToSocketEvents() {
        const socket = openSocket(cnf.webhook_worker.uri);

        socket.on('log', (msg) => {
            console.log(msg);
            this.state.logs.unshift(msg);
            this.setState(this.state);
        });

        socket.on('stockItem', (stockItem) => {
            console.log(stockItem);
            this.state.articles.approved.unshift(stockItem);
            this.setState(this.state);
        });
    }

    componentDidMount() {
        this.updateProgress(true);

        getArticlesLogs().then((result) => {
            this.state.articles = result.articles;
            this.state.logs = result.logs;
            this.state.settings.watch_dir = result.settings.watch_dir;
            this.state.settings.fixed_date = result.settings.fixed_date;
            this.state.loading = false;

            this.setState(this.state);

            this.subscribeToSocketEvents();
        });
    }

    state = {
        activeLogsTab: 0,
        logs: [],
        articles: {
            approved: [],
            unapproved: [],
            expired: [],
        },
        settings: {
            open: false,
            watch_dir: '',
            fixed_date: '',
        },
        loading: false,
        snackbar: {
            open: false,
            message: '',
            vertical: 'top',
            horizontal: 'left',
        },
    };

    onLogTabsChange = (event, value) => {
        this.state.activeLogsTab = value;
        this.setState(this.state);
    };

    updateProgress = (loading) => {
        this.state.loading = loading;
        this.setState(this.state);
    };

    handleSnackbarClose = () => {
        this.state.snackbar.open = false;
        this.state.snackbar.message = '';
        this.setState(this.state);
    };

    handleSettingsOpen = () => {
        this.state.settings.open = true;
        this.setState(this.state);
    };

    handleSettingsClose = () => {
        this.state.settings.open = false;
        this.setState(this.state);
    };

    updateSettingsWatchDir = (e) => {
        this.state.settings.watch_dir = e.target.value;
        this.setState(this.state);
    }

    updateSettingsFixedDate = (e) => {
        this.state.settings.fixed_date = e.target.value;
        this.setState(this.state);
    }

    handleSettingsSave = () => {
        this.state.settings.open = false;
        this.updateProgress(true);

        axios.put('http://localhost:5000/settings', this.state.settings, {
            auth: {
                username: cnf.api.auth.username,
                password: cnf.api.auth.password,
            } })
            .then(() => {
                this.state.loading = false;
                setTimeout(() => {
                    this.state.snackbar.message = 'Instellingen zijn opgeslagen.';
                    this.state.snackbar.open = true;
                    this.setState(this.state);
                }, 1000);
            });
    };

    onFilesProcessed = (msg) => {
        this.state.snackbar.message = msg;
        this.state.snackbar.open = true;
        this.setState(this.state);
    }

    render() {
        return (
            <div className="App">
                {this.state.loading && <CircularProgress size={68} className="progress" />}
                <Snackbar
                    anchorOrigin={
                    { vertical: this.state.snackbar.vertical,
                        horizontal: this.state.snackbar.horizontal,
                    }
                    }
                    open={this.state.snackbar.open}
                    autoHideDuration={6000}
                    onClose={this.handleSnackbarClose}
                    SnackbarContentProps={{
                        'aria-describedby': 'message-id',
                    }}
                    message={<span id="message-id">{this.state.snackbar.message}</span>}
                    action={[
                        <IconButton
                            key="close"
                            aria-label="Close"
                            color="inherit"
                            onClick={this.handleSnackbarClose}>
                            <CloseIcon />
                        </IconButton>,
                    ]} />
                <AppBar position="static" className="appBar">
                    <Toolbar>
                        <Typography type="title" color="inherit" className="flex">
                          J de Jonge certificaten
                        </Typography>
                        <Button color="inherit" onClick={this.handleSettingsOpen}>Instellingen</Button>
                    </Toolbar>
                </AppBar>
                <FileManager onprocessed={this.onFilesProcessed} onprogress={this.updateProgress} />
                <Grid item xs={12}>
                    <ViewLogs
                        logs={this.state.logs}
                        articles={this.state.articles}
                        value={this.state.activeLogsTab}
                        onTabsChange={this.onLogTabsChange} />
                </Grid>
                <SettingsComponent
                    handleClose={this.handleSettingsClose}
                    handleSave={this.handleSettingsSave}
                    settings={this.state.settings}
                    onChangeFixedDate={this.updateSettingsFixedDate}
                    onChangeWatchDir={this.updateSettingsWatchDir} />
            </div>
        );
    }
}

export default App;
