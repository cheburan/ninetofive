<p align="center">
	<br>
	<a href="">Visit the NINEtoFIVE website</a>
</p>


## What is OurPlace?
NINEtoFIVE is a secure anonymous communication platform for employees and members of a any community to have open and honest discussions without fear of sanction. NINETOFIVE.WORK (by default) is available to all employees of the certain organisation and to all members of any community. Our goal is that issues raised, and discussion around these issues, will help to form initiative groups and facilitate coordinated actions.

## Project Structure
The project is split into two sub-projects: 
 - *backend*, 
 - *frontend*.

### Backend
This is NodeJS project contains server-side logic, REST-API and all necessary connections and controls for communicating with DB.  

### Frontend
This is NodeJS project contains frontend logic for web-site, delivered partially by VueJS.

## Required software

### OS
 - Front-Reverse-proxy: Linux-based OS (Ubuntu ^14.04/Debian 7)
 - Middle-Application-server: Linux-based OS (Ubuntu ^14.04/Debian 7)
 - Back-end-DB-server: Linux-based OS (Ubuntu ^14.04/Debian 7)

### Software and npm modules 

- PostgreSQL as a main DB
- MongoDB installed for temporary and passwordless tocken storage
- Open VPN  (for inter-system connection betweeen servers)
- NGINX (configure as a reverse-proxy)
- Python 2.7.x
- npm packages (please see `package.json`)

## Pre-Installation requirements
1) Install node js on a app server (Web_APP server)
2) install postgresql on a db server (DB server)
3) Install and configure nginx server on a front-proxy server (NGINX Server)
4) Install and Configure VPN (openVPN) between the servers.  Web_APP Server acts as server and two other as clients
5) clone repo
6) Install python 2.x and make npm install ona Web_APP server
7) Install mongodb on a Web_APP server

## Usage

- create `config` folder in `/bin` for each sub-project
- copy and fill with appropriate values config file ``default.json`` to created `config` folder
	

> I created NINEtoFIVE as a part of my [EPSRC funded](http://gow.epsrc.ac.uk/NGBOViewGrant.aspx?GrantRef=EP/L016176/1) [Digital Civics](https://digitalcivics.io/) PhD at Open Lab.<br>It is free to use under the GNU General Public License v3.0, a copy of which can be found in this repository.


<p align="center">
	<img src="http://s3.amazonaws.com/libapps/accounts/21667/images/epsrc-lowres.jpg" height="100" align="center">
	<img src="http://indigomultimedia.com/wp-content/uploads/2016/11/dc-dark.svg" height="150" align="center">
	<img src="http://www.collectionsdivetwmuseums.org.uk/img/logos/ncl-light.jpeg" height="100" align="center">
</p>
