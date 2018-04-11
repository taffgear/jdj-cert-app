import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import openSocket from 'socket.io-client';
import Find from 'lodash/find';
import FindIndex from 'lodash/findIndex';
import Size from 'lodash/size';
import Reduce from 'lodash/reduce';
import Omit from 'lodash/omit';
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
import { FormGroup, FormControlLabel } from 'material-ui/Form';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
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

import './App.css';
import logo from '../public/logo.png';

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
            if (f.type === 'text/csv' || f.type === 'application/vnd.ms-excel') {
                files.splice(index, 1);
                this.props.onprogress(true);
                return this.processCSVFile(f);
            }

            return f;
        });

        const filesWithIds = files.map(f => ({ id: shortid.generate(), file: f, selected: true }));
        this.state.items = this.state.items.concat(filesWithIds);
        this.setState(this.state);
    },

    onSelectChange(checked, index) {
        this.state.items[index].selected = checked;
        this.setState(this.state);
    },

    toggleFileCheckbox(index) {
        const checked = this.state.items[index].selected;
        this.state.items[index].selected = (!checked);
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
                    this.state.items.splice(FindIndex(this.state.items, item => item.id === id), 1);
                });

                this.state.files = [];
                this.state.queue = [];

                this.setState(this.state);

                this.props.onprogress(false);
                this.props.onprocessed('De geselecteerde bestanden worden verwerkt.');
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
        const testHeaders = ['test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7', 'test8'];

        this.state.csv_data_mapped = Reduce(this.state.csv_data, (acc, arr) => {
            const row = {};

            fields.forEach((field) => {
                const name = (testHeaders.indexOf(field.name) >= 0 ? `${field.name}@${field.value}` : field.name);
                row[name] = (field.columnIndex >= 0 && arr[field.columnIndex] ? arr[field.columnIndex] : '');
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

                this.props.onprogress(false);
                this.props.onprocessed('CSV bestand is verstuurd naar de server.');
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
                <Grid item xs={4} className="dropzone">
                    <Card className="top-left">
                        <CardContent>
                            <form className="upload-file-form">
                                <Dropzone
                                    onDrop={this.onDrop}
                                    accept="text/csv, application/pdf, application/vnd.ms-excel">
                                    <Typography type="title" component="p" align="center">Sleep bestanden in dit vak of klik op de plus knop om bestanden te selecteren.</Typography>

                                    <Button fab mini color="primary" aria-label="add" className="upload-file">
                                        <AddIcon />
                                    </Button>
                                </Dropzone>
                                {
                    Size(Find(this.state.items, { selected: true })) ?
                        <Button className="process-files" raised color="primary" onClick={this.onProcessFilesClick}>Geselecteerde bestanden verwerken</Button>
                  : ''
                  }

                            </form>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={8}>
                    <Card className="top-right">
                        <CardContent>
                            {
                          this.state.items.length < 1 ?
                              <Typography type="headline" component="h2" align="center">Geselecteerde PDF bestanden worden hier getoond...</Typography>
                        : ''
                        }
                            <List>
                                <ScrollArea
                                    speed={0.8}
                                    className="files-list"
                                    horizontal={false}
                                    minScrollSize={40}>
                                    {this.state.items.map((obj, index) => (
                                        <ListItem
                                            onClick={() => this.toggleFileCheckbox(index)}
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
            fullScreen
            transition={Transition}
            open={props.settings.open}
            onClose={props.handleClose}
            aria-labelledby="form-dialog-title">
            <AppBar className="appBar">
                <Toolbar>
                    <IconButton color="inherit" onClick={props.handleClose} aria-label="Sluiten">
                        <CloseIcon />
                    </IconButton>
                    <Typography type="title" color="inherit" className="flex">
              Instellingen
                    </Typography>
                    <Button color="inherit" onClick={props.handleSave}>
                Opslaan
                    </Button>
                </Toolbar>
            </AppBar>
            <DialogContent className="dialogContent">
                <DialogContentText>
             Pas hier de instellingen aan voor het verwerken van certificaat bestanden.
                </DialogContentText>
                <Divider />
                <br />
                <FormGroup className="mt20 mb20">
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

                <FormGroup row className="mb20 mt20">
                    <Typography type="title" color="inherit" className="flex">
              Aanvinken om artikelen te selecteren.
                    </Typography>

                </FormGroup>

                <FormGroup row>
                    <Typography type="title" color="inherit" className="flex">
                  Gekeurde artikelen
                    </Typography>
                </FormGroup>

                <FormGroup row className="mb20" />

                {Object.keys(props.settings.approved).map(key => (
                    <FormGroup row key={`approved_${key}`}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={props.settings.approved[key].value}
                                    onChange={props.onChangeCheckbox('approved', key)}
                                    value="1" />
                      }
                            label={props.settings.approved[key].label} />
                    </FormGroup>
                ))}

                <FormGroup row className="mb20 mt20">
                    <Typography type="title" color="inherit" className="flex">
                  Ongekeurde artikelen
                    </Typography>
                </FormGroup>

                {Object.keys(props.settings.unapproved).map(key => (
                    <FormGroup row key={`unapproved_${key}`}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={props.settings.unapproved[key].value}
                                    onChange={props.onChangeCheckbox('unapproved', key)}
                                    value="1" />
                      }
                            label={props.settings.unapproved[key].label} />
                    </FormGroup>
                ))}

                <FormGroup row className="mb20 mt20">
                    <Typography type="title" color="inherit" className="flex">
                  Verlopen artikelen
                    </Typography>
                </FormGroup>

                {Object.keys(props.settings.expired).map(key => (
                    <FormGroup row key={`expired_${key}`}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={props.settings.expired[key].value}
                                    onChange={props.onChangeCheckbox('expired', key)}
                                    value="1" />
                      }
                            label={props.settings.expired[key].label} />
                    </FormGroup>
                ))}

            </DialogContent>
        </Dialog>
    </div>
);

const EmailComponent = props => (
    <div>
        <Dialog
            open={props.email.open}
            onClose={props.handleClose}
            aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">E-mail versturen voor artikel {props.email.itemno}</DialogTitle>
            <DialogContent>
                <DialogContentText>
             Geef een of meerdere geldigde e-mailadressen op (comma gescheiden)
                </DialogContentText>
                <Divider />
                <br />
                <FormGroup>
                    <TextField
                        id="email-recipients"
                        label="Ontvanger(s)"
                        type="email"
                        name="recipients"
                        onChange={props.onChangeRecipients}
                        value={props.email.recipients}
                        fullWidth />
                </FormGroup>
                <FormGroup>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="email-subject"
                        name="subject"
                        label="Onderwerp"
                        type="text"
                        onChange={props.onChangeSubject}
                        value={props.email.subject}
                        fullWidth />
                </FormGroup>
                <FormGroup>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="email-body"
                        name="body"
                        label="Bericht"
                        multiline
                        rows={5}
                        onChange={props.onChangeBody}
                        value={props.email.body}
                        fullWidth />
                </FormGroup>
            </DialogContent>
            <DialogActions>
                <Button onClick={props.handleClose} color="primary">
             Annuleren
                </Button>
                <Button onClick={props.handleSave} color="primary">
             Verzenden
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
                    <TableRow key={n.id}>
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
        <Button onClick={() => props.downloadCSV(props.type)} raised color="primary">
            Exporteer als CSV
        </Button>

        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Groep</TableCell>
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
                    <TableRow key={n.ITEMNO}>
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
                <ChecklistArticles type="approved" articles={props.articles.approved} downloadCSV={props.downloadCSV} />
            </TabContainer>}
        {props.value === 2 &&
            <TabContainer>
                <ChecklistArticles type="unapproved" articles={props.articles.unapproved} downloadCSV={props.downloadCSV} />
            </TabContainer>}
        {props.value === 3 &&
            <TabContainer>
                <ChecklistArticles type="expired" articles={props.articles.expired} downloadCSV={props.downloadCSV} />
            </TabContainer>}
    </div>
    );

ViewLogs.propTypes = {
    onTabsChange: PropTypes.func.isRequired,
    value: PropTypes.number.isRequired,
    logs: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        ts: PropTypes.isRequired,
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
    },
        timeout: cnf.request_timeout || 10000 };

    const limit = cnf.max_articles;

    return axios.all([
        axios.get(`${apiURI}/stock/approved/${limit}`, opts),
        axios.get(`${apiURI}/stock/unapproved/${limit}`, opts),
        axios.get(`${apiURI}/stock/expired/${limit}`, opts),
        axios.get(`${apiURI}/logs`, opts),
        axios.get(`${apiURI}/settings`, opts),
    ]).then(axios.spread((ares, ures, eres, lres, sres) => {
        const articles = { approved: ares.data.body, unapproved: ures.data.body, expired: eres.data.body };
        const logs = lres.data.body;
        const settings = sres.data.body;

        return { logs, articles, settings };
    }));
};

const getAllArticles = (type) => {
    const opts = { auth: {
        username: cnf.api.auth.username,
        password: cnf.api.auth.password,
    } };

    return axios.get(`${apiURI}/stock/${type}/0`, opts).then(res => res.data.body);
};

class App extends React.Component {
    getInitialState: () => {
      socket: null,
      logs: [],
      articles: {
        approved: [],
        unapproved: [],
        expired: []
      },
      files: []
    };

    subscribeToSocketEvents() {
        this.state.socket = openSocket(cnf.webhook_worker.uri);

        const logUpdates = [];
        const articleUpdates = [];

        this.state.socket.on('email', (msg) => {
            this.state.email.itemno = msg.itemno;
            this.state.email.filePath = msg.filePath;
            this.state.email.open = true;

            this.setState(this.state);
        });

        this.state.socket.on('email_success', (recipients) => {
            this.state.snackbar.message = `E-mail is verzonden naar ${recipients.join(', ')}`;
            this.state.snackbar.open = true;
            this.setState(this.state);
        });

        this.state.socket.on('email_failed', (msg) => {
            this.state.snackbar.message = `Het verzenden van de e-mail is mislukt: ${msg}`;
            this.state.snackbar.open = true;
            this.setState(this.state);
        });

        this.state.socket.on('log', (msg) => {
            logUpdates.push(msg);

            setTimeout(() => {
                const logs = this.state.logs;

                logUpdates.forEach((l) => {
                    logs.unshift(l);
                });

                logUpdates.length = 0;
                this.setState({ logs });
            }, 1000);
        });

        this.state.socket.on('stockItem', (stockItem) => {
            articleUpdates.push(stockItem);

            setTimeout(() => {
                const articles = this.state.articles;

                articleUpdates.forEach((a) => {
                    const aindex = FindIndex(articles.approved, { ITEMNO: a.ITEMNO });

                    if (aindex >= 0) {
                        articles.approved.splice(aindex, 1);
                    }

                    const uindex = FindIndex(articles.unapproved, { ITEMNO: a.ITEMNO });

                    if (uindex >= 0) {
                        articles.unapproved.splice(uindex, 1);
                    }

                    const eindex = FindIndex(articles.expired, { ITEMNO: a.ITEMNO });

                    if (eindex >= 0) {
                        articles.expired.splice(eindex, 1);
                    }

                    articles.approved.unshift(a);
                });
                articleUpdates.length = 0;
                this.setState({ articles });
            }, 1000);
        });

        this.setState(this.state);
    }

    reloadArticlesLogs(init) {
        this.updateProgress(true);

        getArticlesLogs().then((result) => {
            this.state.articles = result.articles;
            this.state.logs = result.logs;
            this.state.settings.watch_dir = result.settings.watch_dir;
            this.state.settings.fixed_date = result.settings.fixed_date;

            if (result.settings.approved) { this.state.settings.approved = result.settings.approved; }

            if (result.settings.unapproved) { this.state.settings.unapproved = result.settings.unapproved; }

            if (result.settings.expired) { this.state.settings.expired = result.settings.expired; }

            this.state.loading = false;
            this.setState(this.state);

            if (init) this.subscribeToSocketEvents();
        }).catch((e) => {
            console.log(e);

            this.state.loading = false;
            this.setState(this.state);

            if (init) this.subscribeToSocketEvents();
        });
    }

    componentDidMount() {
        this.reloadArticlesLogs(true);
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
            approved: {
                status_0: { value: false, label: 'Beschikbaar' },
                status_1: { value: false, label: 'In Huur' },
                status_2: { value: false, label: 'In Reparatie' },
                status_3: { value: false, label: 'In Onderhoud' },
                status_4: { value: false, label: 'Onderweg' },
                status_5: { value: false, label: 'Gereserveerd' },
                status_6: { value: false, label: 'Afgekeurd' },
                status_7: { value: false, label: 'Retour, nog te testen' },
                status_8: { value: false, label: 'Verkocht' },
                status_9: { value: false, label: 'Vermist/ Gestolen' },
                status_10: { value: false, label: 'Inactief/ Foutief' },
                status_11: { value: false, label: 'Controleren in systeem' },
            },
            unapproved: {
                status_0: { value: false, label: 'Beschikbaar' },
                status_1: { value: false, label: 'In Huur' },
                status_2: { value: false, label: 'In Reparatie' },
                status_3: { value: false, label: 'In Onderhoud' },
                status_4: { value: false, label: 'Onderweg' },
                status_5: { value: false, label: 'Gereserveerd' },
                status_6: { value: false, label: 'Afgekeurd' },
                status_7: { value: false, label: 'Retour, nog te testen' },
                status_8: { value: false, label: 'Verkocht' },
                status_9: { value: false, label: 'Vermist/ Gestolen' },
                status_10: { value: false, label: 'Inactief/ Foutief' },
                status_11: { value: false, label: 'Controleren in systeem' },
            },
            expired: {
                status_0: { value: false, label: 'Beschikbaar' },
                status_1: { value: false, label: 'In Huur' },
                status_2: { value: false, label: 'In Reparatie' },
                status_3: { value: false, label: 'In Onderhoud' },
                status_4: { value: false, label: 'Onderweg' },
                status_5: { value: false, label: 'Gereserveerd' },
                status_6: { value: false, label: 'Afgekeurd' },
                status_7: { value: false, label: 'Retour, nog te testen' },
                status_8: { value: false, label: 'Verkocht' },
                status_9: { value: false, label: 'Vermist/ Gestolen' },
                status_10: { value: false, label: 'Inactief/ Foutief' },
                status_11: { value: false, label: 'Controleren in systeem' },
            },
        },
        email: {
            open: false,
            recipients: '',
            subject: '',
            body: '',
            itemno: '',
            filePath: '',
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
        const activeLogsTab = value;
        this.setState({ activeLogsTab });
    };

    updateProgress = (loading) => {
        this.state.loading = loading;
        this.setState(this.state);
    };

    downloadArticles = (type) => {
        this.updateProgress(true);

        return getAllArticles(type).then((articles) => {
            const csv = Papa.unparse(articles);

            const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const csvURL = window.URL.createObjectURL(csvData);
            const tempLink = document.createElement('a');

            tempLink.href = csvURL;
            tempLink.setAttribute('download', `${type}-articles.csv`);
            tempLink.click();

            this.updateProgress(false);
        });
    };

    handleSnackbarClose = () => {
        this.state.snackbar.open = false;
        this.state.snackbar.message = '';
        this.setState(this.state);
    };

    handleEmailOpen = () => {
        this.state.email.open = true;
        this.setState(this.state);
    };

    handleEmailClose = () => {
        this.state.email.open = false;
        this.setState(this.state);
    };

    updateEmailRecipients = (e) => {
        this.state.email.recipients = e.target.value;
        this.setState(this.state);
    }

    updateEmailSubject = (e) => {
        this.state.email.subject = e.target.value;
        this.setState(this.state);
    }

    updateEmailBody = (e) => {
        this.state.email.body = e.target.value;
        this.setState(this.state);
    }

    handleEmailSave = () => {
        this.state.email.open = false;
        this.updateProgress(true);

        this.state.socket.emit('email', Omit(this.state.email, 'open'));
        this.state.loading = false;
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

    updateSettingsStatus = (cat, name) => (e) => {
        this.state.settings[cat][name].value = e.target.checked;
        this.setState(this.state);
    }

    handleSettingsSave = () => {
        this.state.settings.open = false;
        this.updateProgress(true);

        axios.put(`${apiURI}/settings`, this.state.settings, {
            auth: {
                username: cnf.api.auth.username,
                password: cnf.api.auth.password,
            } })
            .then(() => {
                this.state.socket.emit('settings', Omit(this.state.settings, 'open'));

                this.state.loading = false;
                this.state.snackbar.message = 'Instellingen zijn opgeslagen.';
                this.state.snackbar.open = true;
                this.setState(this.state);

                this.reloadArticlesLogs(false);
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
                        <img width="50" src={logo} alt="logo" />
                        <Typography type="title" color="inherit" className="flex">
                          J. de Jonge Certificaten Manager
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
                        onTabsChange={this.onLogTabsChange}
                        downloadCSV={this.downloadArticles} />
                </Grid>
                <SettingsComponent
                    handleClose={this.handleSettingsClose}
                    handleSave={this.handleSettingsSave}
                    settings={this.state.settings}
                    onChangeFixedDate={this.updateSettingsFixedDate}
                    onChangeWatchDir={this.updateSettingsWatchDir}
                    onChangeCheckbox={this.updateSettingsStatus} />
                <EmailComponent
                    handleClose={this.handleEmailClose}
                    handleSave={this.handleEmailSave}
                    email={this.state.email}
                    onChangeRecipients={this.updateEmailRecipients}
                    onChangeSubject={this.updateEmailSubject}
                    onChangeBody={this.updateEmailBody} />
            </div>
        );
    }
}

export default App;
