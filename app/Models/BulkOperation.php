<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BulkOperation extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'status',
        'total',
        'processed',
        'failed',
        'updated_products',
        'error',
    ];

    protected $casts = [
        'updated_products' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function recordChunkResult(array $newlyUpdatedProducts, int $failedCount): void
    {
        \DB::transaction(function () use ($newlyUpdatedProducts, $failedCount) {
            $fresh = self::where('id', $this->id)->lockForUpdate()->first();

            $merged = array_merge($fresh->updated_products ?? [], $newlyUpdatedProducts);

            $fresh->update([
                'processed' => $fresh->processed + count($newlyUpdatedProducts) + $failedCount,
                'failed' => $fresh->failed + $failedCount,
                'updated_products' => $merged,
                'status' => ($fresh->processed + count($newlyUpdatedProducts) + $failedCount) >= $fresh->total
                    ? 'completed'
                    : 'processing',
            ]);
        });
    }
}