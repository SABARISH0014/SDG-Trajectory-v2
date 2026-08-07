import requests

urls = {
    'WHO': 'https://ghoapi.azureedge.net/api/MDG_0000000026?$top=1',
    'ILOSTAT': 'https://sdmx.ilo.org/rest/data/ILO,DF_INDICATOR,/.SEX_T.AGE_AGGREGATE_TOTAL?lastNObservations=1',
    'UNESCO': 'https://api.uis.unesco.org/sdmx/data/UNESCO,SDG4,1.0/.......?lastNObservations=1',
    'FAOSTAT': 'https://fenixservices.fao.org/faostat/api/v1/en/data/FS?limit=1',
    'UNICEF': 'https://sdmx.data.unicef.org/ws/public/sdmxapi/rest/data/UNICEF,GLOBAL_DATAFLOW,1.0/.MNCH_MMR...?lastNObservations=1'
}

for name, url in urls.items():
    try:
        r = requests.get(url, timeout=10)
        print(f'{name}: Status {r.status_code}, Content-Type: {r.headers.get("Content-Type")}')
        print(r.text[:100] + '\n')
    except Exception as e:
        print(f'{name}: Failed - {e}\n')
