<?php

namespace App\Services;

class BarcodeGeneratorService
{
    /**
     * Generate barcode from pattern.
     *
     * Supported:
     * [N.8] = 8 Numbers
     * [A.4] = 4 Letters
     * [AN.6] = 6 AlphaNumeric
     */
    public function generate(string $pattern = '[N.8]')
    {
        preg_match('/\[(N|A|AN)\.(\d+)\]/', $pattern, $match);

        if (!$match) {
            return rand(10000000,99999999);
        }

        $type = $match[1];
        $length = (int)$match[2];

        switch ($type) {

            case 'N':
                return $this->numbers($length);

            case 'A':
                return $this->letters($length);

            case 'AN':
                return $this->alphaNumeric($length);

            default:
                return $this->numbers($length);
        }
    }

    private function numbers($length)
    {
        $chars = '0123456789';

        return $this->random($chars,$length);
    }

    private function letters($length)
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        return $this->random($chars,$length);
    }

    private function alphaNumeric($length)
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        return $this->random($chars,$length);
    }

    private function random($characters,$length)
    {
        $result = '';

        for($i=0;$i<$length;$i++)
        {
            $result .= $characters[random_int(0,strlen($characters)-1)];
        }

        return $result;
    }
}