
const GRAPH_URL='../engineering-knowledge/knowledge/knowledge-graph.json';
const SEARCH_URL='../engineering-knowledge/json/search-index.json';
let graph=null;
async function loadGraph(){if(!graph){const r=await fetch(GRAPH_URL);graph=await r.json();}return graph;}
async function loadSearch(){const r=await fetch(SEARCH_URL);return r.json();}
function renderTable(rows,cols){if(!rows.length)return'<p>No data</p>';let h='<table><tr>'+cols.map(c=>'<th>'+c+'</th>').join('')+'</tr>';for(const row of rows.slice(0,200))h+='<tr>'+cols.map(c=>'<td>'+(row[c]??'')+'</td>').join('')+'</tr>';return h+'</table>';}
window.EKG={loadGraph,loadSearch,renderTable};
