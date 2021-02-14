/*
 *
 * HomePage
 *
 */

import React, {memo, useState} from 'react';
// import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import {auth} from 'strapi-helper-plugin';
import * as XLSX from "xlsx";
import { Button, InputText } from '@buffetjs/core';

const HomePage = () => {
  const [pars, setPars] = useState(false);

  const readExcel = (file) => {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    setPars('Загрузка файла')
    fileReader.onload = (e) => {
      setPars('Чтение')
      const bufferArray = e.target.result;

      const wb = XLSX.read(bufferArray, {
        type: "buffer",
        // cellStyles: true
      });

      wb.SheetNames.forEach(wsName => {
        const projectCode = wsName.split(' ')[0].split('-')

        if (typeof projectCode[0] === 'string' && Number(projectCode[1])) {
          const ws = wb.Sheets[wsName];


          fetch(`/banis?number=${projectCode[1]}`)
            .then(response => response.json())
            .then(data => {
              if (data.length) {

                const updateData = {
                  price_1: ws.W4.v,
                  price_2: ws.X4.v,
                  price_3: ws.Y4.v,
                  price_4: ws.Z4.v,
                  discount: ws.C4.v,
                }

                fetch(`/banis/${data[0].id}`, {
                  headers: {
                    'Authorization': 'Bearer ' + auth.getToken(),
                    'Content-Type': 'application/json'
                  },
                  withCredentials: true,
                  credentials: 'include',
                  method: 'PUT',
                  body: JSON.stringify(updateData),
                }).then(r => setPars(wsName))

              }
            });
        }
      })
      setPars('Готово')

    };
  };

  return (
    <div style={{padding: "20px"}}>
      <h1>{pluginId} Обновление цены</h1>
      <div style={{paddingTop: "20px"}}>
        <h3>Обновление бань</h3>
        <InputText
          name="file"
          onChange={(e) => {
            const file = e.target.files[0];
            readExcel(file);
          }}
          placeholder="Lastname"
          type="file"
        />
        <p style={{paddingTop: "10px"}}>{pars && <div>{pars}</div>}</p>
      </div>
    </div>
  );
};

export default memo(HomePage);
