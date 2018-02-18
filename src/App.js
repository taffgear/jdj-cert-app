import React from 'react';
import PropTypes from 'prop-types';
import Moment from 'moment';
import Find from 'lodash/find';
import Size from 'lodash/size';
import ScrollArea from 'react-scrollbar';
import Grid from 'material-ui/Grid';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import Button from 'material-ui/Button';
import AddIcon from 'material-ui-icons/Add';
import DeleteIcon from 'material-ui-icons/Delete';
import IconButton from 'material-ui/IconButton';
// import MenuIcon from 'material-ui-icons/Menu';
import Card, { CardContent } from 'material-ui/Card';
import { FormGroup } from 'material-ui/Form';
import Checkbox from 'material-ui/Checkbox';
import TextField from 'material-ui/TextField';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';
import Tabs, { Tab } from 'material-ui/Tabs';
import List, {
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from 'material-ui/List';
import Table, { TableBody, TableCell, TableHead, TableRow } from 'material-ui/Table';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
// import Icon from 'material-ui/Icon';
import Dropzone from 'react-dropzone';
import shortid from 'shortid';
import axios from 'axios';
import findIndex from 'lodash/findIndex';
import { CSVLink } from 'react-csv';

import './App.css';

import cnf from '../config.json';

const FileManager = React.createClass({
    getInitialState() {
        return {
            items: [],
            files: [],
            queue: [],
        };
    },

    onDrop(files) {
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

        axios.post('http://localhost:5000/files', formData, {
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

                setTimeout(this.props.onprocessed, 5000);
            })
            .catch(console.log)
      ;
    },

    onProcessFilesClick() {
        this.state.items.forEach((item) => {
            if (!item.selected) return;

            this.state.queue.push(item.id);
            this.readFile(item.file);
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
                                        accept="application/pdf">
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
            </Grid>
        );
    },
});

FileManager.propTypes = {
    onprocessed: PropTypes.func.isRequired,
};

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
                        <TableCell>{Moment.unix(n.ts).format('DD-MM-YYYY HH:mm:ss')}</TableCell>
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
                    <TableRow key={n.ITEMNO}>
                        <TableCell>{n.PGROUP}</TableCell>
                        <TableCell>{n.GRPCODE}</TableCell>
                        <TableCell>{n.ITEMNO}</TableCell>
                        <TableCell>{n['DESC#1']}</TableCell>
                        <TableCell>{n['DESC#2']}</TableCell>
                        <TableCell>{n['DESC#3']}</TableCell>
                        <TableCell>{n['LASTSER#1']}</TableCell>
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
                <Tab label="Foutmeldingen" />
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
        axios.get('http://localhost:5000/stock/approved', opts),
        axios.get('http://localhost:5000/stock/unapproved', opts),
        axios.get('http://localhost:5000/stock/expired', opts),
        axios.get('http://localhost:5000/logs', opts),
        axios.get('http://localhost:5000/settings', opts),
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

    componentDidMount() {
        getArticlesLogs().then((result) => {
            this.state.articles = result.articles;
            this.state.logs = result.logs;
            this.state.settings.watch_dir = result.settings.watch_dir;
            this.state.settings.fixed_date = result.settings.fixed_date;

            this.setState(this.state);
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
    };

    onLogTabsChange = (event, value) => {
        this.state.activeLogsTab = value;
        this.setState(this.state);
    };

    onFilesProcessed = () => {
        getArticlesLogs().then((result) => {
            this.state.articles = result.articles;
            this.state.logs = result.logs;

            this.setState(this.state);
        });
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
        axios.put('http://localhost:5000/settings', this.state.settings, {
            auth: {
                username: cnf.api.auth.username,
                password: cnf.api.auth.password,
            } })
            .then(() => {
                this.state.settings.open = false;
                this.setState(this.state);
            });
    };

    render() {
        return (
            <div className="App">
                <AppBar position="static">
                    <Toolbar>
                        <Typography type="title" color="inherit">
                          J de Jonge certificaten
                        </Typography>
                        <Button color="inherit" onClick={this.handleSettingsOpen}>Instellingen</Button>
                    </Toolbar>
                </AppBar>
                <FileManager onprocessed={this.onFilesProcessed} />
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
