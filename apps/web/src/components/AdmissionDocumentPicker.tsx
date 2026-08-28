import { FileText, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';

export type PendingAdmissionDocument={id:string;documentType:string;file:File};
const types=[['birth_certificate','Birth Certificate'],['report_card','Report Card'],['good_moral','Certificate of Good Moral Character'],['id_photo','ID Photo'],['previous_school_record','Previous School Record'],['other','Other']] as const;

export function AdmissionDocumentPicker({value,onChange,compact=false}:{value:PendingAdmissionDocument[];onChange:(value:PendingAdmissionDocument[])=>void;compact?:boolean}){
  const[type,setType]=useState('birth_certificate'),input=useRef<HTMLInputElement>(null);
  const add=(files:FileList|null)=>{if(!files)return;const additions=Array.from(files).map(file=>({id:crypto.randomUUID(),documentType:type,file}));onChange([...value,...additions]);if(input.current)input.current.value='';};
  const grouped=types.map(([key,name])=>({key,name,files:value.filter(item=>item.documentType===key)})).filter(group=>group.files.length);
  return <fieldset className={`admission-document-picker${compact?' compact':''}`}><legend>Supporting Documents <span>Optional</span></legend><p>Upload available PDF, JPG, or PNG files. Each file may be up to 8 MB.</p><div className="document-picker-controls"><label>Document type<select value={type} onChange={event=>setType(event.target.value)}>{types.map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label><label className="document-file-control"><span><Plus/>Choose files</span><input ref={input} type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={event=>add(event.target.files)}/></label></div>{grouped.length>0&&<div className="document-selection" aria-live="polite">{grouped.map(group=><section key={group.key}><strong>{group.name}</strong>{group.files.map(item=><div key={item.id}><FileText/><span>{item.file.name}<small>{Math.ceil(item.file.size/1024)} KB</small></span><button type="button" aria-label={`Remove ${item.file.name}`} onClick={()=>onChange(value.filter(candidate=>candidate.id!==item.id))}><X/></button></div>)}</section>)}</div>}</fieldset>;
}
