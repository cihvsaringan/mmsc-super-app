import { consultationRepository } from '../clinic/consultation-repository.js';
import { pool } from './pool.js';

async function run(){
 const encounter=await pool.query(`SELECT id,encounter_date::text FROM clinic_encounters ORDER BY time_in DESC LIMIT 1`);
 const detail=encounter.rows[0]?await consultationRepository.detail(encounter.rows[0].id):null;
 const log=await consultationRepository.dailyLog({date:encounter.rows[0]?String(encounter.rows[0].encounter_date).slice(0,10):new Date().toISOString().slice(0,10),page:1,pageSize:25});
 const stock=await consultationRepository.availableStock();
 process.stdout.write(JSON.stringify({encounterLoaded:!!detail,queueStatus:detail?.encounter.queueStatus??null,guardianCount:detail?.guardians.length??0,interventionCount:detail?.interventions.length??0,medicationCount:detail?.medications.length??0,dailyLogRows:log.items.length,availableStockItems:stock.length},null,2));
}
run().finally(()=>pool.end()).catch(error=>{console.error(error);process.exitCode=1});
