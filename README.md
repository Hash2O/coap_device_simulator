Proposition complète d’un Device Simulator IoT en Node.js respectant les contraintes du cahier des charges :

- CoAP over UDP (pas HTTP)
- Port 5683
- device_id unique
- Ressources /health et /temperature
- GET + PUT
- Simulation d’instabilité (latence, perte, offline)
- Lancement simple

Arobrescence : 
    device-simulator/
    │
    ├── package.json
    ├── package-lock.json
    ├── main.js
    └── node_modules/

Librairie officielle :

- Node.js Foundation
- CoAP (via le module npm coap)

Options disponibles :

    Option	    Description
    --name	    Nom du device
    --latency	Latence artificielle en ms
    --loss	    Taux de perte (0.0 → 1.0)
    --offline	Mode offline (true/false)

Exemple de test avec coap-client :
- coap get coap://localhost:5683/health
- coap get coap://localhost:5683/temperature

=> echo '{"value":22.5}' | coap put coap://localhost:5683/temperature