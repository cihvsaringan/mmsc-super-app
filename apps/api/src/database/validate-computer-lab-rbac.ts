import{pool}from'./pool.js';

const roleCodes=['computer_lab_administrator','computer_lab_staff','laboratory_staff'];
try{
  const target=await pool.query<{database:string;serverAddress:string|null;serverPort:number;serverVersion:string}>(`SELECT current_database() database,inet_server_addr()::text "serverAddress",inet_server_port() "serverPort",current_setting('server_version') "serverVersion"`);
  const migrations=await pool.query<{name:string}>(`SELECT name FROM schema_migrations WHERE name LIKE '005%' OR name LIKE '006%' ORDER BY name`);
  const mappings=await pool.query<{code:string;permissions:string[]}>(`SELECT r.code,COALESCE(array_agg(p.code ORDER BY p.code)FILTER(WHERE p.code IS NOT NULL),'{}') permissions FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.id LEFT JOIN permissions p ON p.id=rp.permission_id AND p.code LIKE 'computer_lab.%' WHERE r.code=ANY($1::text[]) GROUP BY r.code ORDER BY r.code`,[roleCodes]);
  console.log(JSON.stringify({target:target.rows[0],migrations:migrations.rows.map(row=>row.name),roles:mappings.rows},null,2));
}finally{await pool.end()}
