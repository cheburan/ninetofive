/**
 * Created by b0913178 on 09/06/2017.
 */


function addslashes( str ) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

