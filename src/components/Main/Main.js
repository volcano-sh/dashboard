import React from 'react';
import Left from './Left/Left';
import './Main.css';
import Mid from './Mid/Mid';
import Right from './Right/Right';

const Main = () => {
    return (
        <div className='main'>
            <h5>Dashboards</h5>
            <hr />
            <p className='links'>Overview</p>
            <hr />
            <div className='main-container'>
                <Left />
                <Mid />
                <Right />
            </div>
        </div>
    )
}

export default Main
