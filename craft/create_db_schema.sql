create SEQUENCE rowid_seq start 1;

create table block (
  rowid bigint default nextval('public.rowid_seq'::regclass) primary key,
  updated_at timestamp,
  p int not null,
  q int not null,
  x int not null,
  y int not null,
  z int not null,
  w int not null
);
alter table block add constraint unique_block_pqxyz unique (p,q,x,y,z,w);

create table if not exists light (
  p int not null,
  q int not null,
  x int not null,
  y int not null,
  z int not null,
  w int not null
);
create unique index if not exists light_pqxyz_idx on light (p, q, x, y, z);

create table if not exists sign (
  p int not null,
  q int not null,
  x int not null,
  y int not null,
  z int not null,
  face int not null,
  text text not null
);
create index if not exists sign_pq_idx on sign (p, q);

create unique index if not exists sign_xyzface_idx on sign (x, y, z, face);
            
create table if not exists block_history (
  timestamp real not null,
  user_id int not null,
  x int not null,
  y int not null,
  z int not null,
  w int not null
);
