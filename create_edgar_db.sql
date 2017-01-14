create database fund_holdings;
use fund_holdings;

create table thirteen_f (
	id integer(10) auto_increment not null,
    filer integer(8) not null,
    owner varchar(50) not null,
    company varchar(50) not null,
    ticker varchar(10) not null,
    shares integer(12) not null,
    percent_owned varchar(25) not null,
    primary key(id)
);

create table filer_ids(
	filer varchar(10) not null,
    primary key(filer)
);



drop table thirteen_f;
select * from thirteen_f;

drop table filer_ids;
select * from filer_ids;

insert into filer_ids (filer) values (753466),(753721),(753755);

