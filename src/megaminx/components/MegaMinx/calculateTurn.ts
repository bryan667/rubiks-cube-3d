import {rotate_point,rToD} from "./utils";
import type { Point2D } from "./utils";

// Calculates what turn to make when attempting to move a piece
function calculateTurn(
    startPoint: Point2D | null,
    newPoint: Point2D | null,
    selectedSide: string | null,
    selectedPiece: number | null,
    touchedEdge?: boolean
): string | undefined {
    if(!newPoint) return;
    // Mouse/Touch turns for edges
    if(selectedPiece===8){
        let difX = newPoint.x-startPoint!.x;
        let turnDirection = difX>0?"":"'";
        if(touchedEdge||Math.abs(difX)>.2){
            if(selectedSide==="white"){
                return "3"+turnDirection;
            }
            else if(selectedSide==="red"){
                return "1"+turnDirection;
            }
            else if(selectedSide==="darkblue"){
                return "1"+turnDirection;
            }
            else if(selectedSide==="yellow"){
                return "1"+turnDirection;
            }
            else if(selectedSide==="purple"){
                return "1"+turnDirection;
            }
            else if(selectedSide==="darkgreen"){
                return "1"+turnDirection;
            }
            else if(selectedSide==="gray"){
                return "12"+turnDirection;
            }
            else if(selectedSide==="beige"){
                return "7"+turnDirection;
            }
            else if(selectedSide==="pink"){
                return "7"+turnDirection;
            }
            else if(selectedSide==="lightgreen"){
                return "7"+turnDirection;
            }
            else if(selectedSide==="orange"){
                return "7"+turnDirection;
            }
            else if(selectedSide==="lightblue"){
                return "7"+turnDirection;
            }
        }
    }
    else if(selectedPiece===9){
        let newStart = rotate_point(0,0,72,{...startPoint!});
        let newCurrent = rotate_point(0,0,72,{...newPoint});
        let difX = newCurrent[0]-newStart[0];
        let turnDirection = difX>0?"":"'";
        if(touchedEdge||Math.abs(difX)>.2){
            if(selectedSide==="white") return "2"+turnDirection;
            else if(selectedSide==="red") return "3"+turnDirection;
            else if(selectedSide==="darkblue") return "4"+turnDirection;
            else if(selectedSide==="yellow") return "5"+turnDirection;
            else if(selectedSide==="purple") return "6"+turnDirection;
            else if(selectedSide==="darkgreen") return "2"+turnDirection;

            else if(selectedSide==="gray") return "8"+turnDirection;
            else if(selectedSide==="beige") return "12"+turnDirection;
            else if(selectedSide==="pink") return "8"+turnDirection;
            else if(selectedSide==="lightgreen") return "9"+turnDirection;
            else if(selectedSide==="orange") return "10"+turnDirection;
            else if(selectedSide==="lightblue") return "11"+turnDirection;
        }
    }
    else if(selectedPiece===10){
        let newStart = rotate_point(0,0,72*2,{...startPoint!});
        let newCurrent = rotate_point(0,0,72*2,{...newPoint});
        let difX = newCurrent[0]-newStart[0];
        let turnDirection = difX>0?"":"'";
        if(touchedEdge||Math.abs(difX)>.2){
            if(selectedSide==="white") return "6"+turnDirection;
            else if(selectedSide==="red") return "9"+turnDirection;
            else if(selectedSide==="darkblue") return "10"+turnDirection;
            else if(selectedSide==="yellow") return "11"+turnDirection;
            else if(selectedSide==="purple") return "12"+turnDirection;
            else if(selectedSide==="darkgreen") return "8"+turnDirection;

            else if(selectedSide==="gray") return "9"+turnDirection;
            else if(selectedSide==="beige") return "6"+turnDirection;
            else if(selectedSide==="pink") return "2"+turnDirection;
            else if(selectedSide==="lightgreen") return "3"+turnDirection;
            else if(selectedSide==="orange") return "4"+turnDirection;
            else if(selectedSide==="lightblue") return "5"+turnDirection;
        }
    }
    else if(selectedPiece===6){
        let newStart = rotate_point(0,0,72*3,{...startPoint!});
        let newCurrent = rotate_point(0,0,72*3,{...newPoint});
        let difX = newCurrent[0]-newStart[0];
        let turnDirection = difX>0?"":"'";
        if(touchedEdge||Math.abs(difX)>.2){
            if(selectedSide==="white")return "5"+turnDirection;
            else if(selectedSide==="red") return "8"+turnDirection;
            else if(selectedSide==="darkblue") return "9"+turnDirection;
            else if(selectedSide==="yellow") return "10"+turnDirection;
            else if(selectedSide==="purple") return "11"+turnDirection;
            else if(selectedSide==="darkgreen") return "12"+turnDirection;

            else if(selectedSide==="gray") return "10"+turnDirection;
            else if(selectedSide==="beige") return "2"+turnDirection;
            else if(selectedSide==="pink") return "3"+turnDirection;
            else if(selectedSide==="lightgreen") return "4"+turnDirection;
            else if(selectedSide==="orange") return "5"+turnDirection;
            else if(selectedSide==="lightblue") return "6"+turnDirection;
        }
    }
    else if(selectedPiece===7){
        let newStart = rotate_point(0,0,72*4,{...startPoint!});
        let newCurrent = rotate_point(0,0,72*4,{...newPoint});
        let difX = newCurrent[0]-newStart[0];
        let turnDirection = difX>0?"":"'";
        if(touchedEdge||Math.abs(difX)>.2){
            if(selectedSide==="white")return "4"+turnDirection;
            else if(selectedSide==="red") return "6"+turnDirection;
            else if(selectedSide==="darkblue") return "2"+turnDirection;
            else if(selectedSide==="yellow") return "3"+turnDirection;
            else if(selectedSide==="purple") return "4"+turnDirection;
            else if(selectedSide==="darkgreen") return "5"+turnDirection;

            else if(selectedSide==="gray") return "11"+turnDirection;
            else if(selectedSide==="beige") return "9"+turnDirection;
            else if(selectedSide==="pink") return "10"+turnDirection;
            else if(selectedSide==="lightgreen") return "11"+turnDirection;
            else if(selectedSide==="orange") return "12"+turnDirection;
            else if(selectedSide==="lightblue") return "8"+turnDirection;
        }
    }

    // Mouse/Touch turns for corners
    else if (selectedPiece===3){
        let angle = Math.atan2((newPoint.y-startPoint!.y),(newPoint.x-startPoint!.x));
        let degrees = rToD(angle);
        let dist = Math.hypot(newPoint.x-startPoint!.x, newPoint.y-startPoint!.y);

        if(degrees<0) degrees = 360+degrees;

        if(touchedEdge||dist>.2){
            if(selectedSide==="white"){
                if(degrees>=36&&degrees<126) return "4";
                if(degrees>=126&&degrees<216) return "3'";
                if(degrees>=216&&degrees<306) return "4'";
                if(degrees>=306||degrees<36) return "3";
            }
            if(selectedSide==="red"){
                if(degrees>=36&&degrees<126) return "6";
                if(degrees>=126&&degrees<216) return "1'";
                if(degrees>=216&&degrees<306) return "6'";
                if(degrees>=306||degrees<36) return "1";
            }
            if(selectedSide==="darkblue"){
                if(degrees>=36&&degrees<126) return "2";
                if(degrees>=126&&degrees<216) return "1'";
                if(degrees>=216&&degrees<306) return "2'";
                if(degrees>=306||degrees<36) return "1";
            }
            if(selectedSide==="yellow"){
                if(degrees>=36&&degrees<126) return "3";
                if(degrees>=126&&degrees<216) return "1'";
                if(degrees>=216&&degrees<306) return "3'";
                if(degrees>=306||degrees<36) return "1";
            }
            if(selectedSide==="purple"){
                if(degrees>=36&&degrees<126) return "4";
                if(degrees>=126&&degrees<216) return "1'";
                if(degrees>=216&&degrees<306) return "4'";
                if(degrees>=306||degrees<36) return "1";
            }
            if(selectedSide==="darkgreen"){
                if(degrees>=36&&degrees<126) return "5";
                if(degrees>=126&&degrees<216) return "1'";
                if(degrees>=216&&degrees<306) return "5'";
                if(degrees>=306||degrees<36) return "1";
            }
            if(selectedSide==="gray"){
                if(degrees>=36&&degrees<126) return "11";
                if(degrees>=126&&degrees<216) return "12'";
                if(degrees>=216&&degrees<306) return "11'";
                if(degrees>=306||degrees<36) return "12";
            }
            if(selectedSide==="beige"){
                if(degrees>=36&&degrees<126) return "9";
                if(degrees>=126&&degrees<216) return "7'";
                if(degrees>=216&&degrees<306) return "9'";
                if(degrees>=306||degrees<36) return "7";
            }
            if(selectedSide==="pink"){
                if(degrees>=36&&degrees<126) return "10";
                if(degrees>=126&&degrees<216) return "7'";
                if(degrees>=216&&degrees<306) return "10'";
                if(degrees>=306||degrees<36) return "7";
            }
            if(selectedSide==="lightgreen"){
                if(degrees>=36&&degrees<126) return "11";
                if(degrees>=126&&degrees<216) return "7'";
                if(degrees>=216&&degrees<306) return "11'";
                if(degrees>=306||degrees<36) return "7";
            }
            if(selectedSide==="orange"){
                if(degrees>=36&&degrees<126) return "12";
                if(degrees>=126&&degrees<216) return "7'";
                if(degrees>=216&&degrees<306) return "12'";
                if(degrees>=306||degrees<36) return "7";
            }
            if(selectedSide==="lightblue"){
                if(degrees>=36&&degrees<126) return "8";
                if(degrees>=126&&degrees<216) return "7'";
                if(degrees>=216&&degrees<306) return "8'";
                if(degrees>=306||degrees<36) return "7";
            }
        }
    }
    else if (selectedPiece===4){
        let newStart = rotate_point(0,0,72,{...startPoint!});
        let newCurrent = rotate_point(0,0,72,{...newPoint});
        let angle = Math.atan2((newCurrent[1]-newStart[1]),(newCurrent[0]-newStart[0]));
        let degrees = rToD(angle);
        let dist = Math.hypot(newCurrent[0]-newStart[0], newCurrent[1]-newStart[1]);

        if(degrees<0) degrees = 360+degrees;

        if(touchedEdge||dist>.2){
            if(selectedSide==="white"){
                if(degrees>=36&&degrees<126) return "3";
                if(degrees>=126&&degrees<216) return "2'";
                if(degrees>=216&&degrees<306) return "3'";
                if(degrees>=306||degrees<36) return "2";
            }
            if(selectedSide==="red"){
                if(degrees>=36&&degrees<126) return "1";
                if(degrees>=126&&degrees<216) return "3'";
                if(degrees>=216&&degrees<306) return "1'";
                if(degrees>=306||degrees<36) return "3";
            }
            if(selectedSide==="darkblue"){
                if(degrees>=36&&degrees<126) return "1";
                if(degrees>=126&&degrees<216) return "4'";
                if(degrees>=216&&degrees<306) return "1'";
                if(degrees>=306||degrees<36) return "4";
            }
            if(selectedSide==="yellow"){
                if(degrees>=36&&degrees<126) return "1";
                if(degrees>=126&&degrees<216) return "5'";
                if(degrees>=216&&degrees<306) return "1'";
                if(degrees>=306||degrees<36) return "5";
            }
            if(selectedSide==="purple"){
                if(degrees>=36&&degrees<126) return "1";
                if(degrees>=126&&degrees<216) return "6'";
                if(degrees>=216&&degrees<306) return "1'";
                if(degrees>=306||degrees<36) return "6";
            }
            if(selectedSide==="darkgreen"){
                if(degrees>=36&&degrees<126) return "1";
                if(degrees>=126&&degrees<216) return "2'";
                if(degrees>=216&&degrees<306) return "1'";
                if(degrees>=306||degrees<36) return "2";
            }
            if(selectedSide==="gray"){
                if(degrees>=36&&degrees<126) return "12";
                if(degrees>=126&&degrees<216) return "8'";
                if(degrees>=216&&degrees<306) return "12'";
                if(degrees>=306||degrees<36) return "8";
            }
            if(selectedSide==="beige"){
                if(degrees>=36&&degrees<126) return "7";
                if(degrees>=126&&degrees<216) return "12'";
                if(degrees>=216&&degrees<306) return "7'";
                if(degrees>=306||degrees<36) return "12";
            }
            if(selectedSide==="pink"){
                if(degrees>=36&&degrees<126) return "7";
                if(degrees>=126&&degrees<216) return "8'";
                if(degrees>=216&&degrees<306) return "7'";
                if(degrees>=306||degrees<36) return "8";
            }
            if(selectedSide==="lightgreen"){
                if(degrees>=36&&degrees<126) return "7";
                if(degrees>=126&&degrees<216) return "9'";
                if(degrees>=216&&degrees<306) return "7'";
                if(degrees>=306||degrees<36) return "9";
            }
            if(selectedSide==="orange"){
                if(degrees>=36&&degrees<126)return "7";
                if(degrees>=126&&degrees<216) return "10'";
                if(degrees>=216&&degrees<306) return "7'";
                if(degrees>=306||degrees<36) return "10";
            }
            if(selectedSide==="lightblue"){
                if(degrees>=36&&degrees<126)return "7";
                if(degrees>=126&&degrees<216) return "11'";
                if(degrees>=216&&degrees<306) return "7'";
                if(degrees>=306||degrees<36) return "11";
            }
        }
    }
    else if (selectedPiece===5){
        let newStart = rotate_point(0,0,72*2,{...startPoint!});
        let newCurrent = rotate_point(0,0,72*2,{...newPoint});
        let angle = Math.atan2((newCurrent[1]-newStart[1]),(newCurrent[0]-newStart[0]));
        let degrees = rToD(angle);
        let dist = Math.hypot(newCurrent[0]-newStart[0], newCurrent[1]-newStart[1]);

        if(degrees<0) degrees = 360+degrees;

        if(touchedEdge||dist>.2){
            if(selectedSide==="white"){
                if(degrees>=36&&degrees<126) return "2";
                if(degrees>=126&&degrees<216) return "6'";
                if(degrees>=216&&degrees<306) return "2'";
                if(degrees>=306||degrees<36) return "6";
            }
            if(selectedSide==="red"){
                if(degrees>=36&&degrees<126) return "3";
                if(degrees>=126&&degrees<216) return "9'";
                if(degrees>=216&&degrees<306) return "3'";
                if(degrees>=306||degrees<36) return "9";
            }
            if(selectedSide==="darkblue"){
                if(degrees>=36&&degrees<126) return "4";
                if(degrees>=126&&degrees<216) return "10'";
                if(degrees>=216&&degrees<306) return "4'";
                if(degrees>=306||degrees<36) return "10";
            }
            if(selectedSide==="yellow"){
                if(degrees>=36&&degrees<126) return "5";
                if(degrees>=126&&degrees<216) return "11'";
                if(degrees>=216&&degrees<306) return "5'";
                if(degrees>=306||degrees<36) return "11";
            }
            if(selectedSide==="purple"){
                if(degrees>=36&&degrees<126) return "6";
                if(degrees>=126&&degrees<216) return "12'";
                if(degrees>=216&&degrees<306) return "6'";
                if(degrees>=306||degrees<36) return "12";
            }
            if(selectedSide==="darkgreen"){
                if(degrees>=36&&degrees<126) return "2";
                if(degrees>=126&&degrees<216) return "8'";
                if(degrees>=216&&degrees<306) return "2'";
                if(degrees>=306||degrees<36) return "8";
            }
            if(selectedSide==="gray"){
                if(degrees>=36&&degrees<126) return "8";
                if(degrees>=126&&degrees<216) return "9'";
                if(degrees>=216&&degrees<306) return "8'";
                if(degrees>=306||degrees<36) return "9";
            }
            if(selectedSide==="beige"){
                if(degrees>=36&&degrees<126) return "12";
                if(degrees>=126&&degrees<216) return "6'";
                if(degrees>=216&&degrees<306) return "12'";
                if(degrees>=306||degrees<36) return "6";
            }
            if(selectedSide==="pink"){
                if(degrees>=36&&degrees<126) return "8";
                if(degrees>=126&&degrees<216) return "2'";
                if(degrees>=216&&degrees<306) return "8'";
                if(degrees>=306||degrees<36) return "2";
            }
            if(selectedSide==="lightgreen"){
                if(degrees>=36&&degrees<126) return "9";
                if(degrees>=126&&degrees<216) return "3'";
                if(degrees>=216&&degrees<306) return "9'";
                if(degrees>=306||degrees<36) return "3";
            }
            if(selectedSide==="orange"){
                if(degrees>=36&&degrees<126)return "10";
                if(degrees>=126&&degrees<216) return "4'";
                if(degrees>=216&&degrees<306) return "10'";
                if(degrees>=306||degrees<36) return "4";
            }
            if(selectedSide==="lightblue"){
                if(degrees>=36&&degrees<126)return "11";
                if(degrees>=126&&degrees<216) return "5'";
                if(degrees>=216&&degrees<306) return "11'";
                if(degrees>=306||degrees<36) return "5";
            }
        }
    }
    else if (selectedPiece===1){
        let newStart = rotate_point(0,0,72*3,{...startPoint!});
        let newCurrent = rotate_point(0,0,72*3,{...newPoint});
        let angle = Math.atan2((newCurrent[1]-newStart[1]),(newCurrent[0]-newStart[0]));
        let degrees = rToD(angle);
        let dist = Math.hypot(newCurrent[0]-newStart[0], newCurrent[1]-newStart[1]);

        if(degrees<0) degrees = 360+degrees;

        if(touchedEdge||dist>.2){
            if(selectedSide==="white"){
                if(degrees>=36&&degrees<126) return "6";
                if(degrees>=126&&degrees<216) return "5'";
                if(degrees>=216&&degrees<306) return "6'";
                if(degrees>=306||degrees<36) return "5";
            }
            if(selectedSide==="red"){
                if(degrees>=36&&degrees<126) return "9";
                if(degrees>=126&&degrees<216) return "8'";
                if(degrees>=216&&degrees<306) return "9'";
                if(degrees>=306||degrees<36) return "8";
            }
            if(selectedSide==="darkblue"){
                if(degrees>=36&&degrees<126) return "10";
                if(degrees>=126&&degrees<216) return "9'";
                if(degrees>=216&&degrees<306) return "10'";
                if(degrees>=306||degrees<36) return "9";
            }
            if(selectedSide==="yellow"){
                if(degrees>=36&&degrees<126) return "11";
                if(degrees>=126&&degrees<216) return "10'";
                if(degrees>=216&&degrees<306) return "11'";
                if(degrees>=306||degrees<36) return "10";
            }
            if(selectedSide==="purple"){
                if(degrees>=36&&degrees<126) return "12";
                if(degrees>=126&&degrees<216) return "11'";
                if(degrees>=216&&degrees<306) return "12'";
                if(degrees>=306||degrees<36) return "11";
            }
            if(selectedSide==="darkgreen"){
                if(degrees>=36&&degrees<126) return "8";
                if(degrees>=126&&degrees<216) return "12'";
                if(degrees>=216&&degrees<306) return "8'";
                if(degrees>=306||degrees<36) return "12";
            }
            if(selectedSide==="gray"){
                if(degrees>=36&&degrees<126) return "9";
                if(degrees>=126&&degrees<216) return "10'";
                if(degrees>=216&&degrees<306) return "9'";
                if(degrees>=306||degrees<36) return "10";
            }
            if(selectedSide==="beige"){
                if(degrees>=36&&degrees<126) return "6";
                if(degrees>=126&&degrees<216) return "2'";
                if(degrees>=216&&degrees<306) return "6'";
                if(degrees>=306||degrees<36) return "2";
            }
            if(selectedSide==="pink"){
                if(degrees>=36&&degrees<126) return "2";
                if(degrees>=126&&degrees<216) return "3'";
                if(degrees>=216&&degrees<306) return "2'";
                if(degrees>=306||degrees<36) return "3";
            }
            if(selectedSide==="lightgreen"){
                if(degrees>=36&&degrees<126) return "3";
                if(degrees>=126&&degrees<216) return "4'";
                if(degrees>=216&&degrees<306) return "3'";
                if(degrees>=306||degrees<36) return "4";
            }
            if(selectedSide==="orange"){
                if(degrees>=36&&degrees<126)return "4";
                if(degrees>=126&&degrees<216) return "5'";
                if(degrees>=216&&degrees<306) return "4'";
                if(degrees>=306||degrees<36) return "5";
            }
            if(selectedSide==="lightblue"){
                if(degrees>=36&&degrees<126)return "5";
                if(degrees>=126&&degrees<216) return "6'";
                if(degrees>=216&&degrees<306) return "5'";
                if(degrees>=306||degrees<36) return "6";
            }
        }
    }
    else if (selectedPiece===2){
        let newStart = rotate_point(0,0,72*4,{...startPoint!});
        let newCurrent = rotate_point(0,0,72*4,{...newPoint});
        let angle = Math.atan2((newCurrent[1]-newStart[1]),(newCurrent[0]-newStart[0]));
        let degrees = rToD(angle);
        let dist = Math.hypot(newCurrent[0]-newStart[0], newCurrent[1]-newStart[1]);

        if(degrees<0) degrees = 360+degrees;

        if(touchedEdge||dist>.2){
            if(selectedSide==="white"){
                if(degrees>=36&&degrees<126) return "5";
                if(degrees>=126&&degrees<216) return "4'";
                if(degrees>=216&&degrees<306) return "5'";
                if(degrees>=306||degrees<36) return "4";
            }
            if(selectedSide==="red"){
                if(degrees>=36&&degrees<126) return "8";
                if(degrees>=126&&degrees<216) return "6'";
                if(degrees>=216&&degrees<306) return "8'";
                if(degrees>=306||degrees<36) return "6";
            }
            if(selectedSide==="darkblue"){
                if(degrees>=36&&degrees<126) return "9";
                if(degrees>=126&&degrees<216) return "2'";
                if(degrees>=216&&degrees<306) return "9'";
                if(degrees>=306||degrees<36) return "2";
            }
            if(selectedSide==="yellow"){
                if(degrees>=36&&degrees<126) return "10";
                if(degrees>=126&&degrees<216) return "3'";
                if(degrees>=216&&degrees<306) return "10'";
                if(degrees>=306||degrees<36) return "3";
            }
            if(selectedSide==="purple"){
                if(degrees>=36&&degrees<126) return "11";
                if(degrees>=126&&degrees<216) return "4'";
                if(degrees>=216&&degrees<306) return "11'";
                if(degrees>=306||degrees<36) return "4";
            }
            if(selectedSide==="darkgreen"){
                if(degrees>=36&&degrees<126) return "12";
                if(degrees>=126&&degrees<216) return "5'";
                if(degrees>=216&&degrees<306) return "12'";
                if(degrees>=306||degrees<36) return "5";
            }
            if(selectedSide==="gray"){
                if(degrees>=36&&degrees<126) return "10";
                if(degrees>=126&&degrees<216) return "11'";
                if(degrees>=216&&degrees<306) return "10'";
                if(degrees>=306||degrees<36) return "11";
            }
            if(selectedSide==="beige"){
                if(degrees>=36&&degrees<126) return "2";
                if(degrees>=126&&degrees<216) return "9'";
                if(degrees>=216&&degrees<306) return "2'";
                if(degrees>=306||degrees<36) return "9";
            }
            if(selectedSide==="pink"){
                if(degrees>=36&&degrees<126) return "3";
                if(degrees>=126&&degrees<216) return "10'";
                if(degrees>=216&&degrees<306) return "3'";
                if(degrees>=306||degrees<36) return "10";
            }
            if(selectedSide==="lightgreen"){
                if(degrees>=36&&degrees<126) return "4";
                if(degrees>=126&&degrees<216) return "11'";
                if(degrees>=216&&degrees<306) return "4'";
                if(degrees>=306||degrees<36) return "11";
            }
            if(selectedSide==="orange"){
                if(degrees>=36&&degrees<126)return "5";
                if(degrees>=126&&degrees<216) return "12'";
                if(degrees>=216&&degrees<306) return "5'";
                if(degrees>=306||degrees<36) return "12";
            }
            if(selectedSide==="lightblue"){
                if(degrees>=36&&degrees<126)return "6";
                if(degrees>=126&&degrees<216) return "8'";
                if(degrees>=216&&degrees<306) return "6'";
                if(degrees>=306||degrees<36) return "8";
            }
        }
    }
}

export default calculateTurn;
