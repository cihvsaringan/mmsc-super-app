import{pool}from'./pool.js';

const client=await pool.connect();
try{
 await client.query('BEGIN');
 const actor=(await client.query(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE r.code='super_administrator' AND u.status='active' LIMIT 1`)).rows[0]?.id;
 const school=(await client.query(`SELECT id FROM schools WHERE is_primary AND archived_at IS NULL`)).rows[0]?.id;
 if(!actor||!school)throw new Error('Acceptance requires an active Super Administrator and primary school');
 const category=(await client.query(`INSERT INTO library_classifications(school_id,kind,code,name,created_by)VALUES($1,'category','GROUP2-TEST','Group 2 Acceptance',$2)RETURNING id`,[school,actor])).rows[0].id;
 const book=(await client.query(`INSERT INTO library_books(school_id,title,author,category_id,created_by,updated_by)VALUES($1,'Group 2 Acceptance Book','MMSC Test Author',$2,$3,$3)RETURNING id`,[school,category,actor])).rows[0].id;
 const identifiers:string[]=[];
 for(let copy=1;copy<=5;copy++){const value=String((await client.query(`SELECT nextval('library_accession_sequence') value`)).rows[0].value).padStart(6,'0'),identifier=`LIB-${value}`;identifiers.push(identifier);await client.query(`INSERT INTO library_book_copies(book_id,accession_number,barcode,copy_number,created_by,updated_by)VALUES($1,$2,$2,$3,$4,$4)`,[book,identifier,copy,actor])}
 if(new Set(identifiers).size!==5)throw new Error('Generated identifiers were not unique');
 const duplicate=async(column:'barcode'|'accession_number')=>{await client.query('SAVEPOINT duplicate_check');try{await client.query(`INSERT INTO library_book_copies(book_id,accession_number,barcode,copy_number,created_by,updated_by)VALUES($1,$2,$3,6,$4,$4)`,[book,column==='accession_number'?identifiers[0]:'UNIQUE-ACCESSION',column==='barcode'?identifiers[0]:'UNIQUE-BARCODE',actor]);throw new Error(`Duplicate ${column} was accepted`)}catch(error){const code=(error as{code?:string}).code;if(code!=='23505')throw error}finally{await client.query('ROLLBACK TO SAVEPOINT duplicate_check')}};
 await duplicate('barcode');await duplicate('accession_number');
 const firstIdentifier=identifiers[0];if(!firstIdentifier)throw new Error('No generated identifier available for lookup');const lookup=await client.query(`SELECT c.id FROM library_book_copies c WHERE lower(btrim(c.barcode))=lower(btrim($1))`,[` ${firstIdentifier.toLowerCase()} `]);if(!lookup.rows[0])throw new Error('Normalized barcode lookup failed');
 const search=await client.query(`SELECT b.id FROM library_books b WHERE b.title ILIKE $1 ORDER BY lower(b.title) LIMIT 25 OFFSET 0`,['%Acceptance%']);if(!search.rows[0])throw new Error('Catalog search/pagination failed');
 const summary=await client.query(`SELECT count(*)::int total,count(*)FILTER(WHERE status='available')::int available FROM library_book_copies WHERE book_id=$1`,[book]);if(summary.rows[0].total!==5||summary.rows[0].available!==5)throw new Error('Copy summary failed');
 console.log(JSON.stringify({bookCreated:true,bulkCopies:5,generatedIdentifiers:identifiers,duplicateBarcodeRejected:true,duplicateAccessionRejected:true,barcodeLookup:true,searchAndPagination:true}));
 await client.query('ROLLBACK');
}catch(error){await client.query('ROLLBACK');throw error}finally{client.release();await pool.end()}
